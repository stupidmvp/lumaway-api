import { BaseService, DrizzleAdapter } from '@flex-donec/core';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { resolveLLM } from '../../adapters/ai/llm-resolver';
import { observerChapters, observerSessions, observerStepCandidates, projects, walkthroughVersions, walkthroughs } from '../../db/schema';
import { observerGenerateWalkthroughSchema, type ObserverGenerateWalkthroughInput } from './observer-generate-walkthrough.schema';

type Candidate = {
    id: string;
    observerSessionId: string;
    order: number;
    title: string;
    description: string;
    targetSelector: string | null;
    timestampMs: number;
    confidence: number;
    metadata: Record<string, any>;
};

type Chapter = {
    id: string;
    observerSessionId: string;
    startMs: number;
    endMs: number;
    title: string;
    summary: string | null;
};

type RefinedStep = {
    sourceCandidateId: string;
    title: string;
    description: string;
    targetSelector: string | null;
    sourceChapterId?: string;
};

function normalizeLocaleTag(locale?: string | null): string | undefined {
    const raw = String(locale || '').trim();
    if (!raw) return undefined;
    return raw.toLowerCase().replace(/_/g, '-');
}

function isSpanishLocale(locale?: string): boolean {
    return String(locale || '').toLowerCase().startsWith('es');
}

function cleanSelectorForHumanText(selector: string | null | undefined): string {
    const raw = normalizeSelector(selector);
    if (!raw) return '';
    return raw
        .replace(/^#/, '')
        .replace(/\./g, ' ')
        .replace(/[\[\]=:"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function pickCandidateContextText(candidate: Candidate): string {
    const spokenExtract = sanitizeCandidateDescription(candidate.metadata?.spokenExtract);
    const interactionMapText = sanitizeCandidateDescription(candidate.metadata?.interactionMap?.transcriptText);
    const snippet = sanitizeCandidateDescription(candidate.metadata?.transcriptSnippet);
    const baseline = sanitizeCandidateDescription(candidate.description);
    return spokenExtract || interactionMapText || snippet || baseline;
}

type StepTopic = 'origin' | 'destination' | 'carrier' | 'confirmation' | 'schedule' | 'generic';

function inferStepTopic(candidate: Candidate): StepTopic {
    const selectorText = cleanSelectorForHumanText(candidate.targetSelector);
    const label = String(candidate.metadata?.label || '').trim();
    const title = String(candidate.title || '').trim();
    const context = pickCandidateContextText(candidate);
    const bucket = normalizeText(`${selectorText} ${label} ${title} ${context}`);

    if (/(origen|origin|pickup|remitente|sender)/.test(bucket)) return 'origin';
    if (/(destino|destination|recipient|consignatario|entrega)/.test(bucket)) return 'destination';
    if (/(carrier|paqueter|courier|transport|envi[oó]|servicio de env[ií]o)/.test(bucket)) return 'carrier';
    if (/(confirm|confirmar|submit|finalizar|finish|continuar|generar gu[ií]a)/.test(bucket)) return 'confirmation';
    if (/(fecha|date|hora|time|programar|schedule)/.test(bucket)) return 'schedule';
    return 'generic';
}

function buildHumanStepTitleFromCandidate(candidate: Candidate, locale?: string, fallbackTitle?: string): string {
    const action = inferActionType(candidate.title);
    const topic = inferStepTopic(candidate);
    const useSpanish = isSpanishLocale(locale);

    const selectorText = cleanSelectorForHumanText(candidate.targetSelector);
    const label = String(candidate.metadata?.label || '').trim();
    const target = label || selectorText || (useSpanish ? 'la sección correspondiente' : 'the relevant section');

    if (useSpanish) {
        if (topic === 'origin') return 'Registra el origen del envío';
        if (topic === 'destination') return 'Registra el destino del envío';
        if (topic === 'carrier') return 'Selecciona la paquetería del envío';
        if (topic === 'confirmation') return 'Confirma y finaliza el envío';
        if (topic === 'schedule') return 'Define fecha y horario del envío';
        if (action === 'fill') return `Completa la información en ${target}`;
        if (action === 'click') return `Continúa desde ${target}`;
        if (action === 'navigate') return 'Avanza a la siguiente pantalla';
        return normalizeTitle(fallbackTitle || `Actualiza ${target}`);
    }

    if (topic === 'origin') return 'Set shipment origin details';
    if (topic === 'destination') return 'Set shipment destination details';
    if (topic === 'carrier') return 'Choose the shipment carrier';
    if (topic === 'confirmation') return 'Confirm and complete the shipment';
    if (topic === 'schedule') return 'Set shipment date and time';
    if (action === 'fill') return `Complete the information in ${target}`;
    if (action === 'click') return `Continue from ${target}`;
    if (action === 'navigate') return 'Move to the next screen';
    return normalizeTitle(fallbackTitle || `Update ${target}`);
}

function isRoboticStepDescription(text: string): boolean {
    const normalized = normalizeText(text);
    if (!normalized) return true;
    if (normalized.split(' ').length < 6) return true;

    const roboticPatterns = [
        /^(completa|rellena|llena|ingresa|escribe)\s+(el|la)\s+(campo|input)\b/,
        /^(click|haz clic|selecciona)\s+(en\s+)?(el|la)\s+(bot[oó]n|opci[oó]n)\b/,
        /^(navega|ve)\s+(a|hacia)\b/,
        /^perform the observed interaction\b/,
        /^trigger the next action\b/,
        /^provide the required value\b/,
    ];

    return roboticPatterns.some((pattern) => pattern.test(normalized));
}

function buildHumanStepDescriptionFromCandidate(candidate: Candidate, fallbackText?: string): string {
    const action = inferActionType(candidate.title);
    const label = String(candidate.metadata?.label || '').trim();
    const selectorText = cleanSelectorForHumanText(candidate.targetSelector);
    const target = label || selectorText || 'este punto';
    const topic = inferStepTopic(candidate);

    let base = '';
    if (action === 'fill' && topic === 'origin') {
        base = `Registra los datos de origen en ${target} para asegurar recolección, contacto y cobertura correctas desde el inicio.`;
    } else if (action === 'fill' && topic === 'destination') {
        base = `Completa la información de destino en ${target} para evitar rechazos de entrega y mantener trazabilidad del envío.`;
    } else if ((action === 'click' || action === 'fill') && topic === 'carrier') {
        base = `Define la paquetería en ${target} comparando la opción disponible para equilibrar tiempo de entrega y costo del servicio.`;
    } else if ((action === 'click' || action === 'fill') && topic === 'confirmation') {
        base = `Revisa y confirma en ${target} para cerrar el proceso con los datos validados y dejar la operación lista para ejecución.`;
    } else if (action === 'fill' && topic === 'schedule') {
        base = `Configura en ${target} la fecha y horario adecuados para alinear la operación con la ventana logística esperada.`;
    } else if (action === 'fill') {
        base = `Completa ${target} con el dato requerido para mantener consistencia operativa y evitar retrabajos posteriores.`;
    } else if (action === 'click') {
        base = `Ejecuta la acción en ${target} para avanzar al siguiente punto del flujo manteniendo el contexto correcto.`;
    } else if (action === 'navigate') {
        base = `Pasa a la siguiente vista para continuar el flujo sin perder el estado de lo que ya quedó registrado.`;
    } else {
        base = `Realiza este paso en contexto para sostener el avance del flujo y conservar coherencia entre los datos cargados.`;
    }

    const preferred = base.trim();
    if (!fallbackText) return normalizeSentence(preferred);

    const cleanedFallback = normalizeSentence(sanitizeCandidateDescription(fallbackText));
    if (isRoboticStepDescription(cleanedFallback)) return normalizeSentence(preferred);
    return cleanedFallback;
}

function sanitizeCandidateDescription(raw: string | null | undefined): string {
    const text = String(raw || '').trim();
    if (!text) return '';

    // Remove legacy boilerplate prefixes from older observer processors.
    // Apply repeatedly to handle chains like:
    // "Provide the required value. Spoken intent: "..."
    // "Trigger the next action in the UI. "... etc.
    const LEGACY_PREFIXES: RegExp[] = [
        /^Navigate to continue the flow\.\s*/i,
        /^Provide the required value\.\s*/i,
        /^Trigger the next action in the UI\.\s*/i,
        /^Perform the observed interaction\.\s*/i,
        /^Spoken intent:\s*/i,
        /^Intención hablada:\s*/i,
        /^Intento hablado:\s*/i,
    ];

    let cleaned = text;
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of LEGACY_PREFIXES) {
            if (pattern.test(cleaned)) {
                cleaned = cleaned.replace(pattern, '').trim();
                changed = true;
            }
        }
    }

    // Unwrap quoted-only content.
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }

    // Fix malformed trailing/leading quotes left by old templates.
    cleaned = cleaned.replace(/^["']+/, '').replace(/["']+$/, '').trim();

    // Normalize duplicated spaces and punctuation artifacts.
    cleaned = cleaned
        .replace(/\s{2,}/g, ' ')
        .replace(/^[:.\-–—]\s*/, '')
        .trim();

    return cleaned || text;
}

function normalizeText(value: string | null | undefined): string {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeSelector(selector: string | null | undefined): string {
    const raw = String(selector || '').trim();
    if (!raw) return '';
    return raw
        .replace(/:nth-child\(\d+\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function inferActionType(title: string): 'fill' | 'click' | 'navigate' | 'other' {
    const normalized = normalizeText(title);
    if (normalized.startsWith('fill ') || normalized.startsWith('type ') || normalized.startsWith('enter ')) return 'fill';
    if (normalized.startsWith('click ') || normalized.startsWith('select ') || normalized.startsWith('choose ')) return 'click';
    if (normalized.startsWith('navigate ') || normalized.startsWith('go to ')) return 'navigate';
    return 'other';
}

function normalizeSentence(value: string): string {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const cleaned = text.replace(/^[,.:;\-–—\s]+/, '').trim();
    if (!cleaned) return '';
    const first = cleaned.charAt(0).toUpperCase();
    let normalized = `${first}${cleaned.slice(1)}`;
    if (!/[.!?…]$/.test(normalized)) normalized = `${normalized}.`;
    return normalized;
}

function normalizeTitle(value: string): string {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const cleaned = text.replace(/^[,.:;\-–—\s]+/, '').replace(/[.!?…]+$/, '').trim();
    if (!cleaned) return '';
    return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function removeRedundantRefinedSteps(steps: RefinedStep[]): RefinedStep[] {
    const output: RefinedStep[] = [];
    const semanticSeen = new Map<string, number>();

    for (const step of steps) {
        const selector = normalizeSelector(step.targetSelector);
        const action = inferActionType(step.title);
        const desc = normalizeText(step.description);
        const title = normalizeText(step.title);
        const semanticKey = `${action}|${selector || 'no-selector'}|${title}`;
        const nearDupKey = `${selector || 'no-selector'}|${desc}`;
        const previousAt = semanticSeen.get(semanticKey);

        if (previousAt !== undefined && Math.abs(output.length - previousAt) <= 3) {
            continue;
        }

        const isNearDuplicate = output.some((candidate) => {
            const candidateKey = `${normalizeSelector(candidate.targetSelector) || 'no-selector'}|${normalizeText(candidate.description)}`;
            return candidateKey === nearDupKey;
        });
        if (isNearDuplicate) continue;

        output.push({
            ...step,
            title: normalizeTitle(step.title),
            description: normalizeSentence(sanitizeCandidateDescription(step.description)),
        });
        semanticSeen.set(semanticKey, output.length - 1);
    }

    return output;
}

function buildStepFromRefined(refined: RefinedStep, sourceCandidate: Candidate) {
    const interactionMap = (sourceCandidate.metadata?.interactionMap || {}) as Record<string, any>;
    const transcriptWindowStartMs = typeof interactionMap.transcriptWindowStartMs === 'number'
        ? interactionMap.transcriptWindowStartMs
        : sourceCandidate.timestampMs;
    const transcriptWindowEndMs = typeof interactionMap.transcriptWindowEndMs === 'number'
        ? interactionMap.transcriptWindowEndMs
        : sourceCandidate.timestampMs + 4000;
    const transcriptSegmentStartMs = typeof interactionMap.transcriptSegmentStartMs === 'number'
        ? interactionMap.transcriptSegmentStartMs
        : null;
    const transcriptSegmentEndMs = typeof interactionMap.transcriptSegmentEndMs === 'number'
        ? interactionMap.transcriptSegmentEndMs
        : null;

    return {
        id: crypto.randomUUID(),
        title: refined.title,
        description: sanitizeCandidateDescription(refined.description),
        target: refined.targetSelector || undefined,
        placement: 'auto' as const,
        metadata: {
            ...(sourceCandidate.metadata || {}),
            source: {
                observerSessionId: sourceCandidate.observerSessionId,
                observerStepCandidateId: sourceCandidate.id,
                observerChapterId: refined.sourceChapterId || null,
            },
            timing: {
                eventTimestampMs: sourceCandidate.timestampMs,
                transcriptWindowStartMs,
                transcriptWindowEndMs,
                transcriptSegmentStartMs,
                transcriptSegmentEndMs,
                transcriptSegmentCount: Number(interactionMap.transcriptSegmentCount || 0),
            },
            confidence: sourceCandidate.confidence / 100,
        },
    };
}

function findChapterForTimestamp(chapters: Chapter[], timestampMs: number): Chapter | undefined {
    return chapters.find((chapter) => timestampMs >= chapter.startMs && timestampMs <= chapter.endMs);
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
    const deduped: Candidate[] = [];

    for (const candidate of candidates) {
        const selector = normalizeSelector(candidate.targetSelector);
        const action = inferActionType(candidate.title);
        const prev = deduped[deduped.length - 1];

        if (!prev) {
            deduped.push(candidate);
            continue;
        }

        const prevSelector = normalizeSelector(prev.targetSelector);
        const prevAction = inferActionType(prev.title);
        const gap = Math.max(0, candidate.timestampMs - prev.timestampMs);

        // Remove strict duplicates in short windows.
        if (
            selector
            && prevSelector
            && selector === prevSelector
            && action === prevAction
            && gap <= 15000
        ) {
            if (action === 'fill') {
                deduped[deduped.length - 1] = candidate;
            }
            continue;
        }

        // If click + fill happen on the same selector, keep only fill.
        if (selector && prevSelector && selector === prevSelector && gap <= 12000) {
            if (prevAction === 'click' && action === 'fill') {
                deduped[deduped.length - 1] = candidate;
                continue;
            }
            if (prevAction === 'fill' && action === 'click') {
                continue;
            }
        }

        deduped.push(candidate);
    }

    // Wider dedupe by semantic selector key.
    const strict: Candidate[] = [];
    const seen = new Map<string, Candidate>();

    for (const candidate of deduped) {
        const selector = normalizeSelector(candidate.targetSelector);
        const action = inferActionType(candidate.title);
        if (!selector) {
            strict.push(candidate);
            continue;
        }
        const key = `${action}|${selector}`;
        const previous = seen.get(key);
        if (previous) {
            const gap = Math.abs(candidate.timestampMs - previous.timestampMs);
            if (gap <= 20000) {
                if (action === 'fill') {
                    const idx = strict.findIndex((item) => item.id === previous.id);
                    if (idx >= 0) {
                        strict[idx] = candidate;
                    }
                    seen.set(key, candidate);
                }
                continue;
            }
        }
        strict.push(candidate);
        seen.set(key, candidate);
    }

    return strict;
}

function fallbackDescriptionFromSteps(
    walkthroughTitle: string,
    intent: string | null | undefined,
    refinedSteps: RefinedStep[]
): string {
    const headline = normalizeSentence(intent?.trim() || walkthroughTitle).replace(/[.!?…]+$/, '');
    if (!refinedSteps.length) {
        return `${headline}. Esta guía te ayuda a completar la tarea de principio a fin sin perderte.`;
    }

    const phases = new Set<string>();
    for (const step of refinedSteps) {
        const text = normalizeText(`${step.title} ${step.targetSelector || ''} ${step.description}`);
        if (/crear|nuevo|new|start|iniciar|abrir/.test(text)) phases.add('apertura del flujo');
        if (/origin|origen/.test(text)) phases.add('registro de origen');
        if (/destination|destino/.test(text)) phases.add('registro de destino');
        if (/carrier|paqueter|transport|courier/.test(text)) phases.add('selección de paquetería');
        if (/confirm|confirmar|submit|enviar|finish|final/.test(text)) phases.add('confirmación final');
    }

    const looksLikeShippingFlow =
        phases.has('registro de origen')
        || phases.has('registro de destino')
        || phases.has('selección de paquetería');

    if (looksLikeShippingFlow) {
        return `Esta guía te ayuda a completar un envío de forma clara, desde la captura de datos hasta la confirmación final.`;
    }

    return `Esta guía te acompaña para completar el proceso de forma clara hasta lograr el resultado esperado.`;
}

function sanitizeWalkthroughDescription(raw: string, fallback: string): string {
    const value = normalizeSentence(raw || '').trim();
    if (!value) return normalizeSentence(fallback);

    const cleaned = value
        .replace(/^objetivo del flujo:\s*/i, '')
        .replace(/^visi[oó]n general del flujo(?:\s+para)?\s*/i, '')
        .replace(/^lumen walkthrough\s+\d{1,2}\/\d{1,2}\/\d{2,4}[:.]?\s*/i, '')
        .replace(/\s+/g, ' ')
        .replace(/\b(step|paso)\s*\d+\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/(?:\s*[·•\-]\s*)+/g, ' ')
        .trim();

    // Reject descriptions that look like concatenated step narration.
    const looksConcatenated = /\b(luego|despues|después|entonces)\b/gi.test(cleaned) && (cleaned.match(/,/g) || []).length >= 2;
    if (looksConcatenated) return normalizeSentence(fallback);

    // Reject explicit phase lists (e.g. "apertura del flujo, registro de origen...").
    const looksLikePhaseList = /(apertura del flujo|registro de origen|registro de destino|selecci[oó]n de paqueter[ií]a|confirmaci[oó]n final)/i.test(cleaned)
        && (cleaned.match(/,/g) || []).length >= 1;
    if (looksLikePhaseList) return normalizeSentence(fallback);

    return normalizeSentence(cleaned);
}

const refineSchema = z.object({
    walkthroughDescription: z.string().min(1).max(600),
    steps: z.array(z.object({
        sourceCandidateId: z.string().uuid(),
        title: z.string().min(3).max(160),
        description: z.string().min(3).max(420),
        targetSelector: z.string().max(500).nullable().optional(),
    })).min(1),
});

async function refineWalkthroughWithAI(input: {
    orgId: string;
    projectId: string;
    projectLocale?: string;
    walkthroughTitle: string;
    intent: string | null | undefined;
    candidates: Candidate[];
    chapter?: Chapter;
}): Promise<{ description: string; refinedSteps: RefinedStep[] }> {
    const { orgId, projectId, projectLocale, walkthroughTitle, intent, candidates, chapter } = input;

    const dedupedCandidates = dedupeCandidates(candidates);
    const llm = await resolveLLM(orgId, projectId);

    const payload = dedupedCandidates.map((candidate) => ({
        sourceCandidateId: candidate.id,
        timestampMs: candidate.timestampMs,
        title: candidate.title,
        description: sanitizeCandidateDescription(candidate.description),
        targetSelector: candidate.targetSelector,
        confidence: candidate.confidence,
        label: candidate.metadata?.label ?? null,
        transcriptSnippet: candidate.metadata?.transcriptSnippet ?? null,
        interactionMap: candidate.metadata?.interactionMap ?? null,
        restrictionHints: candidate.metadata?.restrictionHints ?? null,
    }));

    const prompt = [
        'Eres un editor experto en walkthroughs de producto.',
        'Refina los pasos para que sean consistentes, sin duplicados y accionables.',
        'Reglas obligatorias:',
        '- Mantén el orden temporal.',
        '- No inventes pasos ni selectores.',
        '- Elimina duplicados semánticos (especialmente click/fill sobre mismo selector).',
        '- Escribe títulos y descripciones claras en español, corrigiendo sintaxis.',
        '- Cada descripción de paso debe explicar el propósito del paso y su valor para el usuario (no solo qué botón/campo tocar).',
        '- Mantén un tono humano y natural: evita texto robótico tipo "Completa el campo X" o "Haz click en Y" sin contexto.',
        '- Cuando exista transcriptSnippet o spokenExtract, incorpóralo brevemente si aporta intención o criterio de negocio.',
        '- Evita frases repetidas entre pasos.',
        '- Usa interactionMap como línea base para mapear texto al paso correcto.',
        '- Prioriza transcriptSegmentStartMs/transcriptSegmentEndMs y transcriptWindowStartMs/transcriptWindowEndMs para mantener coherencia temporal del texto.',
        '- Si restrictionHints indica intento cancelado previo, no crees un paso separado de cancelación; úsalo como contexto del paso válido.',
        '- La descripción del walkthrough debe ser una visión general (1-2 frases), sin enumerar pasos ni concatenar acciones con "luego".',
        `- Idioma objetivo para títulos y descripciones: ${projectLocale || 'es'}.`,
        '',
        `Título base: ${walkthroughTitle}`,
        `Intención: ${intent || 'N/A'}`,
        chapter ? `Capítulo: ${chapter.title}` : 'Capítulo: sesión completa',
        'Pasos candidatos (JSON):',
        JSON.stringify(payload),
    ].join('\n');

    const result = await llm.structured(prompt, refineSchema, {
        system: 'Devuelve únicamente información factual derivada de los candidatos. No agregues pasos no observados.',
    });

    const allowedIds = new Set(dedupedCandidates.map((candidate) => candidate.id));
    const seen = new Set<string>();
    const refinedSteps: RefinedStep[] = [];

    for (const step of result.steps) {
        if (!allowedIds.has(step.sourceCandidateId)) continue;
        if (seen.has(step.sourceCandidateId)) continue;
        seen.add(step.sourceCandidateId);

        refinedSteps.push({
            sourceCandidateId: step.sourceCandidateId,
            title: buildHumanStepTitleFromCandidate(
                dedupedCandidates.find((candidate) => candidate.id === step.sourceCandidateId)!,
                projectLocale,
                step.title.trim()
            ),
            description: buildHumanStepDescriptionFromCandidate(
                dedupedCandidates.find((candidate) => candidate.id === step.sourceCandidateId)!,
                sanitizeCandidateDescription(step.description)
            ),
            targetSelector: step.targetSelector ? step.targetSelector.trim() : null,
            sourceChapterId: chapter?.id,
        });
    }

    const cleanedRefinedSteps = removeRedundantRefinedSteps(refinedSteps);

    if (!cleanedRefinedSteps.length) {
        const fallbackSteps = dedupedCandidates.map((candidate) => ({
            sourceCandidateId: candidate.id,
            title: buildHumanStepTitleFromCandidate(candidate, projectLocale, candidate.title),
            description: buildHumanStepDescriptionFromCandidate(candidate, candidate.description),
            targetSelector: candidate.targetSelector,
            sourceChapterId: chapter?.id,
        }));
        return {
            description: fallbackDescriptionFromSteps(walkthroughTitle, intent, fallbackSteps),
            refinedSteps: fallbackSteps,
        };
    }

    return {
        description: sanitizeWalkthroughDescription(
            String(result.walkthroughDescription || '').trim(),
            fallbackDescriptionFromSteps(walkthroughTitle, intent, cleanedRefinedSteps)
        ),
        refinedSteps: cleanedRefinedSteps,
    };
}

export class ObserverGenerateWalkthroughService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async create(data: ObserverGenerateWalkthroughInput, params?: any): Promise<any> {
        const parsed = observerGenerateWalkthroughSchema.safeParse(data);
        if (!parsed.success) throw new Error('Invalid payload');

        const db = (this.adapter as any).db;
        const userId = params?.user?.id;
        const { observerSessionId, mode, baseTitle } = parsed.data;

        const [session] = await db
            .select()
            .from(observerSessions)
            .where(eq(observerSessions.id, observerSessionId))
            .limit(1);

        if (!session) throw new Error('Observer session not found');
        if (!['ready_for_review', 'processing', 'uploaded'].includes(session.status)) {
            throw new Error(`Session must be processed before generation. Current status: '${session.status}'`);
        }

        const candidates = await db
            .select()
            .from(observerStepCandidates)
            .where(eq(observerStepCandidates.observerSessionId, observerSessionId))
            .orderBy(asc(observerStepCandidates.order)) as Candidate[];

        if (candidates.length === 0) {
            throw new Error('No step candidates available for this Lumen');
        }

        const chapters = await db
            .select()
            .from(observerChapters)
            .where(eq(observerChapters.observerSessionId, observerSessionId))
            .orderBy(asc(observerChapters.startMs)) as Chapter[];

        const [projectRow] = await db
            .select({
                organizationId: projects.organizationId,
                settings: projects.settings,
            })
            .from(projects)
            .where(eq(projects.id, session.projectId))
            .limit(1);

        if (!projectRow?.organizationId) {
            throw new Error('Project organization not found for walkthrough generation');
        }
        const projectSettings = (projectRow.settings || {}) as Record<string, any>;
        const projectLocale = normalizeLocaleTag(String(projectSettings.defaultLocale || ''));

        const created: Array<{ walkthroughId: string; title: string; stepsCount: number }> = [];

        if (mode === 'single' || chapters.length === 0) {
            const title = baseTitle || session.intent || `Lumen Walkthrough ${new Date(session.startedAt).toLocaleDateString()}`;
            const withChapterMap = candidates.map((candidate) => ({
                candidate,
                chapter: findChapterForTimestamp(chapters, candidate.timestampMs),
            }));

            let refined;
            try {
                refined = await refineWalkthroughWithAI({
                    orgId: projectRow.organizationId,
                    projectId: session.projectId,
                    projectLocale,
                    walkthroughTitle: title,
                    intent: session.intent,
                    candidates: withChapterMap.map((item) => item.candidate),
                });
            } catch {
                const fallbackCandidates = dedupeCandidates(withChapterMap.map((item) => item.candidate));
                const fallbackSteps = fallbackCandidates.map((candidate) => {
                    const chapter = findChapterForTimestamp(chapters, candidate.timestampMs);
                    return {
                        sourceCandidateId: candidate.id,
                        title: buildHumanStepTitleFromCandidate(candidate, projectLocale, candidate.title),
                        description: buildHumanStepDescriptionFromCandidate(candidate, candidate.description),
                        targetSelector: candidate.targetSelector,
                        sourceChapterId: chapter?.id,
                    };
                });
                refined = {
                    description: fallbackDescriptionFromSteps(title, session.intent, fallbackSteps),
                    refinedSteps: fallbackSteps,
                };
            }

            const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
            const steps = refined.refinedSteps
                .map((step) => {
                    const source = candidateById.get(step.sourceCandidateId);
                    if (!source) return null;
                    return buildStepFromRefined(step, source);
                })
                .filter(Boolean) as ReturnType<typeof buildStepFromRefined>[];

            const insertedWalkthroughs = await db.insert(walkthroughs).values({
                projectId: session.projectId,
                title,
                description: refined.description,
                steps,
                tags: ['lumen-generated'],
                isPublished: false,
                trigger: null,
                executionMode: 'automatic',
                repeatable: false,
                updatedAt: new Date(),
            }).returning();
            const walkthrough = insertedWalkthroughs[0] as any;

            await db.insert(walkthroughVersions).values({
                walkthroughId: walkthrough.id,
                versionNumber: 1,
                title: walkthrough.title,
                steps: walkthrough.steps || [],
                status: 'draft',
                isPublished: false,
                createdBy: userId || null,
            });

            created.push({ walkthroughId: walkthrough.id, title: walkthrough.title, stepsCount: steps.length });
        } else {
            const byChapter = new Map<string, { chapter: Chapter; candidates: Candidate[] }>();
            for (const chapter of chapters) byChapter.set(chapter.id, { chapter, candidates: [] });

            for (const candidate of candidates) {
                const chapter = findChapterForTimestamp(chapters, candidate.timestampMs);
                if (chapter) {
                    byChapter.get(chapter.id)?.candidates.push(candidate);
                }
            }

            let previousWalkthroughId: string | null = null;
            const walkthroughRows: Array<{ id: string; title: string; stepsCount: number }> = [];

            for (const [, value] of byChapter) {
                if (value.candidates.length === 0) continue;
                const title = `${baseTitle || session.intent || 'Lumen'} · ${value.chapter.title}`;
                let refined;
                try {
                    refined = await refineWalkthroughWithAI({
                        orgId: projectRow.organizationId,
                        projectId: session.projectId,
                        projectLocale,
                        walkthroughTitle: title,
                        intent: session.intent,
                        candidates: value.candidates,
                        chapter: value.chapter,
                    });
                } catch {
                    const fallbackCandidates = dedupeCandidates(value.candidates);
                    const fallbackSteps = fallbackCandidates.map((candidate) => ({
                        sourceCandidateId: candidate.id,
                        title: buildHumanStepTitleFromCandidate(candidate, projectLocale, candidate.title),
                        description: buildHumanStepDescriptionFromCandidate(candidate, candidate.description),
                        targetSelector: candidate.targetSelector,
                        sourceChapterId: value.chapter.id,
                    }));
                    refined = {
                        description: fallbackDescriptionFromSteps(title, session.intent, fallbackSteps),
                        refinedSteps: fallbackSteps,
                    };
                }

                const candidateById = new Map(value.candidates.map((candidate) => [candidate.id, candidate]));
                const steps = refined.refinedSteps
                    .map((step) => {
                        const source = candidateById.get(step.sourceCandidateId);
                        if (!source) return null;
                        return buildStepFromRefined(step, source);
                    })
                    .filter(Boolean) as ReturnType<typeof buildStepFromRefined>[];

                const insertedWalkthroughs = await db.insert(walkthroughs).values({
                    projectId: session.projectId,
                    title,
                    description: refined.description || value.chapter.summary || `Generated from chapter ${value.chapter.title}`,
                    steps,
                    tags: ['lumen-generated', 'chapter-generated'],
                    isPublished: false,
                    trigger: null,
                    executionMode: 'automatic',
                    repeatable: false,
                    previousWalkthroughId: previousWalkthroughId,
                    updatedAt: new Date(),
                }).returning();
                const walkthrough = insertedWalkthroughs[0] as any;

                await db.insert(walkthroughVersions).values({
                    walkthroughId: walkthrough.id,
                    versionNumber: 1,
                    title: walkthrough.title,
                    steps: walkthrough.steps || [],
                    status: 'draft',
                    isPublished: false,
                    createdBy: userId || null,
                });

                if (previousWalkthroughId) {
                    await db.update(walkthroughs)
                        .set({ nextWalkthroughId: walkthrough.id, updatedAt: new Date() })
                        .where(eq(walkthroughs.id, previousWalkthroughId));
                }

                previousWalkthroughId = walkthrough.id;
                walkthroughRows.push({ id: walkthrough.id, title: walkthrough.title, stepsCount: steps.length });
            }

            created.push(...walkthroughRows.map((row) => ({
                walkthroughId: row.id,
                title: row.title,
                stepsCount: row.stepsCount,
            })));
        }

        await db.update(observerSessions).set({
            processingSummary: {
                ...(session.processingSummary || {}),
                generatedAt: new Date().toISOString(),
                generatedMode: mode,
                generatedWalkthroughIds: created.map((item) => item.walkthroughId),
            },
            updatedAt: new Date(),
        }).where(and(eq(observerSessions.id, observerSessionId), eq(observerSessions.projectId, session.projectId)));

        return {
            observerSessionId,
            mode,
            createdWalkthroughs: created,
        };
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
