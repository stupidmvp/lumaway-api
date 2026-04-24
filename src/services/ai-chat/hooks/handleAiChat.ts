import { db } from '../../../adapters';
import { apiKeys, projects, walkthroughs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveLLM } from '../../../adapters/ai/llm-resolver';
import { conversationStore } from '../conversation.store';
import { AiChatTeamOrchestrator } from '../agents/team-orchestrator';
import { IdentityAgent } from '../agents/identity-agent';
import type { TeamRequesterContext } from '../agents/types';
import { AssistAgent } from '../agents/assist-agent';
import { BrowserFlowAgent } from '../agents/browser-flow-agent';

const BASE_INTENT_ANALYSIS_PROMPT = `Eres {ASSISTANT_NAME}, asistente experta de LumaWay para soporte operativo y guía contextual.

Principios:
- Mantén continuidad conversacional entre turnos.
- Responde en el idioma del usuario.
- Basa respuestas únicamente en contexto publicado (walkthroughs + pasos + historial).
- No inventes funcionalidades.
- Evita respuestas genéricas; responde con criterio profesional.
- Si hay nombre de usuario disponible, úsalo naturalmente para personalizar.
- No conviertas cada respuesta en pregunta; usa cierre declarativo cuando no se requiera confirmar una decisión.
`;

function detectResponseLanguage(message: string): string {
    const lower = message.toLowerCase().trim();
    const englishIndicators = /\b(hi|hello|hey|how|what|can you|could you|i want|please|thanks|thank you|yes|no|help|configure|profile|settings|create|add)\b/i;
    const spanishIndicators = /\b(hola|qué|cómo|dónde|para|aquí|gracias|sí|no|ayuda|configurar|perfil|ajustes|crear|añadir)\b/i;
    if (englishIndicators.test(lower) && !spanishIndicators.test(lower)) {
        return 'IMPORTANT: The user wrote in English. Respond entirely in English.';
    }
    if (spanishIndicators.test(lower)) {
        return 'IMPORTANT: El usuario escribió en español. Responde enteramente en español.';
    }
    return 'IMPORTANT: Respond in the same language as the user message.';
}

function buildMinimalContextFallback(
    walkthroughsData: Array<{ title: string; description?: string | null; steps: any[] }>
): string {
    const flow = walkthroughsData.find((w) => Array.isArray(w.steps) && w.steps.length > 0);
    if (!flow) {
        return 'No tengo suficiente contexto publicado para responder con precisión. Puedo ayudarte a navegar al flujo correcto.';
    }
    const desc = String(flow.description || '').trim();
    if (desc) return `Con el contexto publicado, el flujo más directo es "${flow.title}": ${desc}`;
    return `Con el contexto publicado, el flujo más directo es "${flow.title}".`;
}

function sanitizeUserFacingMessage(message: string): string {
    if (!message) return '';
    let clean = message;

    // Remove explicit DOM selector references in user-facing text.
    clean = clean.replace(/\[\s*(target|selector|dom|elemento)\s*:\s*#[^\]]+\]/gi, '');
    clean = clean.replace(/\b(target|selector|dom|elemento)\s*:\s*#[a-z0-9\-_:.]+/gi, '');

    // Remove raw CSS id selector fragments shown as technical notes.
    clean = clean.replace(/\(\s*#[a-z0-9\-_:.]+\s*\)/gi, '');
    clean = clean.replace(/\bID\s*:\s*"?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"?/gi, '');
    clean = clean.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '');

    // Normalize spacing/new lines after removals.
    clean = clean.replace(/[ \t]{2,}/g, ' ');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    clean = clean.trim();
    if (/[¿¡\(\[\{:"'\-–—]\s*$/.test(clean)) {
        clean = clean.replace(/[¿¡\(\[\{:"'\-–—]\s*$/, '').trim();
    }
    if (clean && !/[.!?…]$/.test(clean)) {
        clean = `${clean}.`;
    }
    return clean;
}

function isDirectShipmentExecutionRequest(message: string): boolean {
    const m = normalizeForMatch(message);
    return (
        /\b(crea|crear|genera|generar|haz|hacer|prepara|preparar)\b/.test(m)
        && /\b(envio|envios|guia|paquete)\b/.test(m)
    );
}

function findShipmentWalkthroughId(
    walkthroughsData: Array<{ id: string; title: string; description?: string | null; steps?: any[] }>
): string | null {
    let best: { id: string; score: number } | null = null;

    for (const wt of walkthroughsData) {
        const title = normalizeForMatch(String(wt.title || ''));
        const desc = normalizeForMatch(String(wt.description || ''));
        const steps = Array.isArray(wt.steps) ? wt.steps : [];
        const actionableSteps = steps.filter((s: any) => typeof s?.target === 'string' && s.target.trim().startsWith('#'));
        const hasSubmitStep = steps.some((s: any) => {
            const t = normalizeForMatch(String(s?.title || s?.description || s?.purpose || ''));
            return t.includes('finalizar') || t.includes('confirmar') || t.includes('submit');
        });

        let score = 0;
        if (title.includes('nuevo') && title.includes('envio')) score += 15;
        if (title.includes('envio')) score += 8;
        if (title.includes('guia')) score += 4;
        if (title.includes('shipment')) score += 6;
        if (desc.includes('generar una guia') || desc.includes('guia de envio')) score += 6;
        score += Math.min(actionableSteps.length, 6);
        if (hasSubmitStep) score += 3;

        // Penalize high-level tours/orchestrators with no actionable selectors.
        if (actionableSteps.length === 0) score -= 8;
        if (title.includes('tour')) score -= 3;
        if (title.includes('principal') && title.includes('logistico')) score -= 2;

        if (score <= 0) continue;
        if (!best || score > best.score) {
            best = { id: wt.id, score };
        }
    }

    return best?.id || null;
}

function parseShipmentValuesFromMessage(message: string): {
    origin?: string;
    destination?: string;
    carrier?: string;
} {
    const text = String(message || '');
    const out: { origin?: string; destination?: string; carrier?: string } = {};

    const originMatch = text.match(/(?:origen|origin)\s*[:=-]?\s*([0-9]{4,10}|[A-Za-z0-9\-\s]{3,40})/i);
    if (originMatch?.[1]) out.origin = originMatch[1].trim();

    const destinationMatch = text.match(/(?:destino|destination)\s*[:=-]?\s*(.+?)(?=,\s*(?:paqueter[ií]a|carrier)\b|$)/i);
    if (destinationMatch?.[1]) out.destination = destinationMatch[1].trim();

    const carrierMatch = text.match(/(?:paqueter[ií]a|carrier)\s*[:=-]?\s*([A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\-\s]{3,60})/i);
    if (carrierMatch?.[1]) out.carrier = carrierMatch[1].trim();

    return out;
}

function buildFallbackShipmentAssistPlan(
    walkthrough: { steps: any[] },
    values: { origin?: string; destination?: string; carrier?: string }
):
    | {
        mode: 'assist';
        summary?: string;
        needsConfirmation?: boolean;
        fields: Array<{ stepId: string; target: string; value: string; reason?: string; confidence?: number }>;
    }
    | undefined {
    const steps = Array.isArray(walkthrough.steps) ? walkthrough.steps : [];
    const fields: Array<{ stepId: string; target: string; value: string; reason?: string; confidence?: number }> = [];

    for (const step of steps) {
        const stepId = String(step?.id || '');
        const target = String(step?.target || '');
        if (!stepId || !target) continue;
        const title = normalizeForMatch(String(step?.title || ''));
        const desc = normalizeForMatch(String(step?.description || step?.purpose || ''));
        const text = `${title} ${desc}`;

        if (!fields.some((f) => f.stepId === stepId) && values.origin && (text.includes('origen') || text.includes('origin'))) {
            fields.push({ stepId, target, value: values.origin, reason: 'origin', confidence: 0.9 });
            continue;
        }
        if (!fields.some((f) => f.stepId === stepId) && values.destination && (text.includes('destino') || text.includes('destination'))) {
            fields.push({ stepId, target, value: values.destination, reason: 'destination', confidence: 0.9 });
            continue;
        }
        if (!fields.some((f) => f.stepId === stepId) && values.carrier && (text.includes('paqueteria') || text.includes('carrier') || text.includes('preferida'))) {
            fields.push({ stepId, target, value: values.carrier, reason: 'carrier', confidence: 0.9 });
            continue;
        }
    }

    if (fields.length === 0) return undefined;
    return {
        mode: 'assist',
        summary: 'Preparé un prellenado automático con los datos que indicaste.',
        needsConfirmation: true,
        fields,
    };
}

function buildDeterministicShipmentBrowserSteps(
    walkthrough: { steps: any[] },
    values: { origin?: string; destination?: string; carrier?: string }
): Array<{ tool: string; args?: Record<string, unknown> }> {
    const steps = Array.isArray(walkthrough.steps) ? walkthrough.steps : [];
    const out: Array<{ tool: string; args?: Record<string, unknown> }> = [];
    const firstRoutedStep = steps.find((s: any) => typeof s?.metadata?.route === 'string' && String(s.metadata.route).trim());
    const route = typeof firstRoutedStep?.metadata?.route === 'string' ? String(firstRoutedStep.metadata.route).trim() : '';
    if (route) {
        out.push({ tool: 'navigate', args: { url: route } });
        out.push({ tool: 'waitFor', args: { timeout: 900 } });
    }

    for (const step of steps) {
        const target = typeof step?.target === 'string' ? String(step.target).trim() : '';
        if (!target) continue;
        const text = normalizeForMatch(`${step?.title || ''} ${step?.description || step?.purpose || ''}`);
        const lowerTarget = target.toLowerCase();

        const isOrigin = text.includes('origen') || text.includes('origin');
        const isDestination = text.includes('destino') || text.includes('destination');
        const isCarrier = text.includes('paqueteria') || text.includes('carrier') || text.includes('preferida');
        const isStartAction = text.includes('iniciar') || text.includes('crear') || text.includes('comenzar') || text.includes('nuevo');
        const isFinishAction = text.includes('finalizar') || text.includes('confirmar') || text.includes('guardar') || text.includes('submit');
        const looksClickable = lowerTarget.includes('btn') || lowerTarget.includes('button') || lowerTarget.includes('cta');
        const looksSelect = lowerTarget.includes('select') || lowerTarget.includes('dropdown');

        if (isOrigin && values.origin) {
            out.push({ tool: 'waitFor', args: { selector: target, timeout: 5000 } });
            out.push({ tool: 'fill', args: { selector: target, value: values.origin } });
            continue;
        }
        if (isDestination && values.destination) {
            out.push({ tool: 'waitFor', args: { selector: target, timeout: 5000 } });
            out.push({ tool: 'fill', args: { selector: target, value: values.destination } });
            continue;
        }
        if (isCarrier && values.carrier) {
            out.push({ tool: 'waitFor', args: { selector: target, timeout: 5000 } });
            out.push({ tool: looksSelect ? 'select' : 'fill', args: looksSelect ? { selector: target, label: values.carrier, value: values.carrier } : { selector: target, value: values.carrier } });
            continue;
        }

        if (isStartAction || isFinishAction || looksClickable) {
            out.push({ tool: 'waitFor', args: { selector: target, timeout: 5000 } });
            out.push({ tool: 'click', args: { selector: target } });
        }
    }

    return out;
}

function normalizeForMatch(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function isShortAffirmation(message: string): boolean {
    const m = normalizeForMatch(message);
    return [
        'si', 'sí', 'ok', 'okay', 'dale', 'de una', 'claro', 'va', 'listo', 'yes', 'yep'
    ].includes(m);
}

function isShortAcknowledgement(message: string): boolean {
    const m = normalizeForMatch(message);
    return [
        'gracias', 'genial', 'perfecto', 'super', 'súper', 'entendido', 'ok', 'vale', 'listo', 'thanks'
    ].includes(m);
}

function inferWalkthroughFromLastAssistantMessage(
    lastAssistantMessage: string | undefined,
    walkthroughList: Array<{ id: string; title: string }>
): string[] {
    if (!lastAssistantMessage) return [];
    const text = normalizeForMatch(lastAssistantMessage);
    const matched = walkthroughList
        .filter((w) => text.includes(normalizeForMatch(w.title)))
        .map((w) => w.id);
    return matched.slice(0, 3);
}

function looksGenericBreak(message: string): boolean {
    const m = normalizeForMatch(message || '');
    return (
        m.includes('no podemos ayudarte en este momento')
        || m.includes('no puedo ayudarte en este momento')
        || m.includes('en este momento no')
        || m.includes('no entendi')
        || m.includes('no entiendo')
    );
}

function looksContextLossExcuse(message: string): boolean {
    const m = normalizeForMatch(message || '');
    return (
        m.includes('historial de conversacion') ||
        m.includes('historial de conversacion anterior') ||
        m.includes('historial desaparecio') ||
        m.includes('respuesta anterior ha sido borrado') ||
        m.includes('respuesta anterior fue borrada') ||
        m.includes('no puedo acceder a ella') ||
        m.includes('perdi el contexto') ||
        m.includes('perdi el historial') ||
        m.includes('i lost the context') ||
        m.includes('lost conversation history')
    );
}

function normalizeLocaleTag(locale?: string): string | undefined {
    const raw = String(locale || '').trim();
    if (!raw) return undefined;
    return raw.replace('_', '-');
}

function getRequesterContext(
    context: any,
    projectSettings?: { defaultLocale?: string; supportedLocales?: string[] }
): TeamRequesterContext {
    const headers = context.params?.headers || {};
    const userIdHeader = headers['x-luma-user-id'];
    const actorSlugHeader = headers['x-actor-slug'];
    const localeHeader = headers['x-luma-locale'];
    const sessionIdHeader = headers['x-luma-session-id'];

    const userId = typeof userIdHeader === 'string' && userIdHeader.trim()
        ? userIdHeader.trim()
        : 'anonymous';
    const actorSlug = typeof actorSlugHeader === 'string' && actorSlugHeader.trim()
        ? actorSlugHeader.trim()
        : undefined;
    const requestedLocale = typeof localeHeader === 'string' && localeHeader.trim()
        ? normalizeLocaleTag(localeHeader)
        : undefined;
    const projectDefaultLocale = normalizeLocaleTag(projectSettings?.defaultLocale);
    const projectSupportedLocale = Array.isArray(projectSettings?.supportedLocales)
        ? normalizeLocaleTag(projectSettings.supportedLocales[0])
        : undefined;
    const locale = requestedLocale || projectDefaultLocale || projectSupportedLocale;
    const sessionId = typeof sessionIdHeader === 'string' && sessionIdHeader.trim()
        ? sessionIdHeader.trim()
        : undefined;

    return { userId, actorSlug, locale, sessionId };
}

function buildSystemPrompt(assistantName: string, projectSystemPrompt?: string): string {
    let systemPrompt = '';
    if (projectSystemPrompt) {
        systemPrompt = projectSystemPrompt.trim() + '\n\n';
    }
    systemPrompt += BASE_INTENT_ANALYSIS_PROMPT.replace('{ASSISTANT_NAME}', assistantName);
    return systemPrompt;
}

function shouldAttemptIdentityCapture(
    userMessage: string,
    lastAssistantMessage: string | undefined,
    userTurns: number,
): boolean {
    const msg = userMessage.trim().toLowerCase();
    const last = (lastAssistantMessage || '').toLowerCase();

    const explicitNamePattern = /\b(me llamo|mi nombre es|soy)\b/i;
    if (explicitNamePattern.test(msg)) return true;

    const assistantAskedName = /\b(como te llamas|cómo te llamas|tu nombre|tu nombre\?)\b/i.test(last);
    if (assistantAskedName && msg.length <= 80) return true;

    // Keep identity extraction off the hot path unless there is signal.
    if (userTurns < 2) return false;
    return false;
}

/**
 * Before hook for `create` on `ai-chat`.
 *
 * Team of agents pipeline:
 * 1) Planner agent (security + intent + retrieval)
 * 2) Response agent
 */
export const handleAiChat = async (context: any) => {
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;
    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    const keyRows = await db
        .select({ projectId: apiKeys.projectId })
        .from(apiKeys)
        .where(eq(apiKeys.key, apiKey))
        .limit(1);

    const keyRecord = keyRows[0];
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;

    const projectRows = await db
        .select({
            organizationId: projects.organizationId,
            settings: projects.settings,
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    const project = projectRows[0];
    if (!project) {
        throw new Error('Project not found');
    }

    const orgId = project.organizationId;
    const projectSettings = (project.settings as any) || {};
    const requester = getRequesterContext(context, projectSettings);
    const assistantName = projectSettings.assistantName || 'Oriana';
    const assistantSystemPrompt = projectSettings.assistantSystemPrompt;

    const { message } = context.data;
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw new Error('Message is required');
    }

    const projectWalkthroughs = await db
        .select({
            id: walkthroughs.id,
            title: walkthroughs.title,
            description: walkthroughs.description,
            steps: walkthroughs.steps,
            tags: walkthroughs.tags,
            parentId: walkthroughs.parentId,
            previousWalkthroughId: walkthroughs.previousWalkthroughId,
            nextWalkthroughId: walkthroughs.nextWalkthroughId,
        })
        .from(walkthroughs)
        .where(and(
            eq(walkthroughs.projectId, projectId),
            eq(walkthroughs.isPublished, true),
        ));

    const conversationHistory = await conversationStore.formatHistory(projectId, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
        assistantName,
    });
    const priorMessages = await conversationStore.getHistory(projectId, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });
    const lastAssistantMessage = [...priorMessages].reverse().find((m) => m.role === 'assistant')?.content;
    const lastUserMessage = [...priorMessages].reverse().find((m) => m.role === 'user')?.content;
    const conversationContext = conversationHistory
        ? `Historial de conversación:\n${conversationHistory}\n\n`
        : '';

    await conversationStore.addMessage(projectId, 'user', message.trim(), {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });

    const contextSummary = projectWalkthroughs.map((wt) => {
        const steps = Array.isArray(wt.steps) ? wt.steps : [];
        let summary = `- ID: "${wt.id}" | Título: ${wt.title}`;
        if (wt.description) summary += `: ${wt.description}`;
        if (steps.length > 0) {
            summary += `\n  Pasos:`;
            for (const step of steps) {
                const title = step?.title || step?.id || '';
                const desc = String(step?.description || step?.purpose || '').slice(0, 140);
                summary += `\n    · ${title}: ${desc || '—'}`;
            }
        }
        return summary;
    }).join('\n\n');

    const llm = await resolveLLM(orgId, projectId);
    const systemPrompt = buildSystemPrompt(assistantName, assistantSystemPrompt);
    const languageHint = detectResponseLanguage(message.trim());
    const orchestrator = new AiChatTeamOrchestrator();
    const identityAgent = new IdentityAgent();
    const assistAgent = new AssistAgent();
    const browserFlowAgent = new BrowserFlowAgent();

    const isAnonymous = requester.userId === 'anonymous';
    let profile = await conversationStore.getProfile(projectId, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });

    if (isAnonymous && !profile.userName && shouldAttemptIdentityCapture(message.trim(), lastAssistantMessage, profile.userTurns)) {
        const identity = await identityAgent.run({
            userMessage: message.trim(),
            lastAssistantMessage,
            lastUserMessage,
            assistantName,
            assistantSystemPrompt,
            languageHint,
            conversationContext,
            requesterContext: requester,
            anonymousProfile: {
                isAnonymous: true,
                userTurns: profile.userTurns,
                userName: undefined,
                shouldAskName: profile.userTurns >= 2,
            },
            walkthroughs: projectWalkthroughs as any,
            contextSummary,
            llm,
            systemPrompt,
        });
        if (identity.hasProvidedName && identity.providedName) {
            await conversationStore.setUserName(projectId, identity.providedName, {
                userId: requester.userId,
                actorSlug: requester.actorSlug,
                sessionId: requester.sessionId,
            });
            profile = await conversationStore.getProfile(projectId, {
                userId: requester.userId,
                actorSlug: requester.actorSlug,
                sessionId: requester.sessionId,
            });
        }
    }

    const requesterWithProfile: TeamRequesterContext = {
        ...requester,
        userName: profile.userName,
    };
    const streamCallbacks = context.params?.streamCallbacks as
        | { onResponsePartial?: (partial: string, delta: string) => void }
        | undefined;

    let teamResult: {
        blocked: boolean;
        intent: string;
        responseType: 'answer' | 'guide' | 'clarify';
        confidence: number;
        message: string;
        suggestedWalkthroughIds: string[];
    };

    try {
        teamResult = await orchestrator.run({
            userMessage: message.trim(),
            lastAssistantMessage,
            lastUserMessage,
            assistantName,
            assistantSystemPrompt,
            languageHint,
            conversationContext,
            requesterContext: requesterWithProfile,
            anonymousProfile: {
                isAnonymous,
                userTurns: profile.userTurns,
                userName: profile.userName,
                shouldAskName: isAnonymous && !profile.userName && profile.userTurns >= 2,
            },
            walkthroughs: projectWalkthroughs as any,
            contextSummary,
            llm,
            systemPrompt,
            streamCallbacks,
        });
    } catch (error) {
        console.error('AI chat team orchestrator failed', error);
        teamResult = {
            blocked: false,
            intent: 'unknown',
            responseType: 'answer',
            confidence: 0.2,
            message: buildMinimalContextFallback(projectWalkthroughs as any),
            suggestedWalkthroughIds: [],
        };
    }

    // Continuity recovery: if the user confirms briefly ("sí", "ok", "dale") after
    // an assistant offer, infer the walkthrough from the previous assistant message
    // and surface actionable guide chips.
    if (
        isShortAffirmation(message.trim()) &&
        (!teamResult.suggestedWalkthroughIds || teamResult.suggestedWalkthroughIds.length === 0)
    ) {
        const inferredIds = inferWalkthroughFromLastAssistantMessage(
            lastAssistantMessage,
            projectWalkthroughs.map((w) => ({ id: w.id, title: w.title }))
        );
        if (inferredIds.length > 0) {
            teamResult = {
                ...teamResult,
                responseType: 'guide',
                suggestedWalkthroughIds: inferredIds,
            };
        }
    }

    // Conversational fluency recovery:
    // avoid breaking replies on short acknowledgements and keep continuity.
    if (isShortAcknowledgement(message.trim()) && looksGenericBreak(teamResult.message)) {
        const inferredIds = inferWalkthroughFromLastAssistantMessage(
            lastAssistantMessage,
            projectWalkthroughs.map((w) => ({ id: w.id, title: w.title }))
        );
        if (inferredIds.length > 0) {
            teamResult = {
                ...teamResult,
                responseType: 'guide',
                suggestedWalkthroughIds: inferredIds,
                message: 'Perfecto. Continuamos con el flujo que veníamos viendo.',
            };
        } else {
            teamResult = {
                ...teamResult,
                responseType: 'answer',
                message: 'Perfecto. Seguimos con el mismo contexto para ayudarte sin perder el hilo.',
            };
        }
    }

    // Deterministic fallback for direct shipment execution requests.
    // Prevents conversational "error" dead-ends when LLM degrades.
    if (isDirectShipmentExecutionRequest(message.trim())) {
        const shipmentWtId = findShipmentWalkthroughId(projectWalkthroughs as any);
        if (shipmentWtId) {
            teamResult = {
                ...teamResult,
                responseType: 'guide',
                suggestedWalkthroughIds: Array.from(new Set([shipmentWtId, ...(teamResult.suggestedWalkthroughIds || [])])).slice(0, 2),
                message: 'Perfecto. Ya preparé el flujo con tus datos para crear el envío.',
            };
        }
    }

    const actions: Array<{ label: string; walkthroughId: string; stepId: string }> = [];
    let assistPlan:
        | {
            mode: 'assist';
            summary?: string;
            needsConfirmation?: boolean;
            fields: Array<{ stepId: string; target: string; value: string; reason?: string; confidence?: number }>;
        }
        | undefined;
    let browserFlowPlan:
        | {
            mode: 'runFlow';
            summary?: string;
            needsConfirmation?: boolean;
            steps: Array<{ tool: string; args?: Record<string, unknown> }>;
        }
        | undefined;

    const getFirstStep = (walkthrough: any): { walkthroughId: string; stepId: string } | null => {
        const steps = walkthrough.steps as Array<{ id?: string }>;
        if (!steps || steps.length === 0) {
            const firstChild = projectWalkthroughs.find(w => w.parentId === walkthrough.id);
            if (firstChild) return getFirstStep(firstChild);
            return null;
        }
        if (steps[0]?.id) {
            return { walkthroughId: walkthrough.id, stepId: steps[0].id };
        }
        return null;
    };

    if (teamResult.responseType === 'guide') {
        for (const wtId of teamResult.suggestedWalkthroughIds || []) {
            const wt = projectWalkthroughs.find((w) => w.id === wtId);
            if (!wt) continue;
            const firstStep = getFirstStep(wt);
            if (!firstStep) continue;
            actions.push({
                label: wt.title,
                walkthroughId: firstStep.walkthroughId,
                stepId: firstStep.stepId,
            });
        }

        // Assist-mode MVP: when user asks to create/prepare a shipment with concrete values,
        // extract field values and return a confirmable fill plan for the host UI.
        const primaryWtId = teamResult.suggestedWalkthroughIds?.[0];
        if (primaryWtId) {
            const primaryWt = projectWalkthroughs.find((w) => w.id === primaryWtId);
            if (primaryWt) {
                const plan = await assistAgent.run(
                    {
                        userMessage: message.trim(),
                        lastAssistantMessage,
                        lastUserMessage,
                        assistantName,
                        assistantSystemPrompt,
                        languageHint,
                        conversationContext,
                        requesterContext: requesterWithProfile,
                        anonymousProfile: {
                            isAnonymous,
                            userTurns: profile.userTurns,
                            userName: profile.userName,
                            shouldAskName: isAnonymous && !profile.userName && profile.userTurns >= 2,
                        },
                        walkthroughs: projectWalkthroughs as any,
                        contextSummary,
                        llm,
                        systemPrompt,
                        streamCallbacks,
                    },
                    primaryWt as any
                );
                if (plan.mode === 'assist' && plan.fields.length > 0) {
                    assistPlan = {
                        mode: 'assist',
                        summary: plan.summary,
                        needsConfirmation: true,
                        fields: plan.fields,
                    };
                }

                const browserPlan = await browserFlowAgent.run(
                    {
                        userMessage: message.trim(),
                        lastAssistantMessage,
                        lastUserMessage,
                        assistantName,
                        assistantSystemPrompt,
                        languageHint,
                        conversationContext,
                        requesterContext: requesterWithProfile,
                        anonymousProfile: {
                            isAnonymous,
                            userTurns: profile.userTurns,
                            userName: profile.userName,
                            shouldAskName: isAnonymous && !profile.userName && profile.userTurns >= 2,
                        },
                        walkthroughs: projectWalkthroughs as any,
                        contextSummary,
                        llm,
                        systemPrompt,
                        streamCallbacks,
                    },
                    primaryWt as any
                );
                if (browserPlan.mode === 'runFlow' && browserPlan.steps.length > 0) {
                    browserFlowPlan = {
                        mode: 'runFlow',
                        summary: browserPlan.summary,
                        needsConfirmation: true,
                        steps: browserPlan.steps,
                    };
                }
            }
        }
    }

    // Deterministic shipping execution plan:
    // for direct shipment requests, enforce ordered UI actions from the published walkthrough
    // to avoid skipping steps and ensure visible navigation + click/fill sequence.
    if (isDirectShipmentExecutionRequest(message.trim())) {
        const shipmentWtId = findShipmentWalkthroughId(projectWalkthroughs as any);
        const shipmentWt = shipmentWtId ? projectWalkthroughs.find((w) => w.id === shipmentWtId) : null;
        if (shipmentWt) {
            const values = parseShipmentValuesFromMessage(message.trim());
            const fallbackAssist = buildFallbackShipmentAssistPlan(shipmentWt as any, values);
            if (!assistPlan && fallbackAssist) {
                assistPlan = fallbackAssist;
            }
            const steps = buildDeterministicShipmentBrowserSteps(shipmentWt as any, values);
            if (steps.length > 0) {
                browserFlowPlan = {
                    mode: 'runFlow',
                    summary: 'Preparé una ejecución guiada paso a paso del envío.',
                    needsConfirmation: true,
                    steps,
                };
            }
        }
    }

    let responseMessage = sanitizeUserFacingMessage(
        teamResult.message || buildMinimalContextFallback(projectWalkthroughs as any)
    );
    const finalActions: Array<{ label: string; walkthroughId?: string; stepId?: string; action?: string }> = [...actions];
    if (assistPlan?.mode === 'assist') {
        finalActions.unshift({
            label: 'Aplicar datos sugeridos',
            action: '__luma_assist_apply__',
        });
    }
    if (browserFlowPlan?.mode === 'runFlow') {
        finalActions.unshift({
            label: 'Ejecutar flujo automático',
            action: '__luma_browser_run__',
        });
    }

    // UX guardrail: for direct action intents, do not ask user to choose a guide again.
    if (
        isDirectShipmentExecutionRequest(message.trim())
        && finalActions.some((a) => a.action === '__luma_browser_run__' || a.action === '__luma_assist_apply__')
    ) {
        responseMessage = 'Perfecto. Ya preparé el flujo con tus datos. Puedes ejecutar la automatización o iniciar el paso a paso.';
    }

    if (looksContextLossExcuse(responseMessage)) {
        responseMessage = finalActions.length > 0
            ? 'Seguimos en el mismo hilo. Ya tengo el contexto y dejé listas las acciones para continuar.'
            : 'Seguimos en el mismo hilo. Ya tengo contexto para ayudarte a continuar.';
    }

    await conversationStore.addMessage(projectId, 'assistant', responseMessage, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });

    context.result = {
        message: responseMessage,
        walkthroughsUsed: projectWalkthroughs.length,
        ...(finalActions.length > 0 ? { actions: finalActions } : {}),
        ...(assistPlan ? { assistPlan } : {}),
        ...(browserFlowPlan ? { browserFlowPlan } : {}),
    };

    return context;
};
