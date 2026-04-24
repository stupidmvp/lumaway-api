import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../adapters';
import { observerChapters, observerEvents, observerSessions, observerStepCandidates, projects } from '../../db/schema';
import { ObserverProcessingTeamOrchestrator } from './agents/team-orchestrator';
import { transcribeStepWindows } from './step-chunk-transcriber';
import { resolveLLM } from '../../adapters/ai/llm-resolver';
import { z } from 'zod';

type RawEvent = {
    id: string;
    type: 'click' | 'input' | 'change' | 'navigation' | 'scroll' | 'custom';
    timestampMs: number;
    url: string | null;
    targetSelector: string | null;
    label: string | null;
    payload: Record<string, any> | null;
};

type TranscriptSegment = {
    startMs: number;
    endMs: number;
    text: string;
};

type InteractionMappedStep = {
    eventId: string;
    timestampMs: number;
    chapterIndex: number;
    chapterTitle: string;
    transcriptText: string;
    transcriptWindowStartMs: number;
    transcriptWindowEndMs: number;
    transcriptSegmentStartMs: number | null;
    transcriptSegmentEndMs: number | null;
    transcriptSegmentCount: number;
    transcriptChunks: Array<{ startMs: number; endMs: number; text: string }>;
    mappingConfidence: number;
};

type FlowSignals = {
    skipEventIds: Set<string>;
    restrictionByEventId: Map<string, Record<string, any>>;
};

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

function isFormMutationEvent(event: RawEvent): boolean {
    return event.type === 'input' || event.type === 'change';
}

function normalizeUrlPath(url: string | null | undefined): string {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return String(url).trim();
    }
}

function buildIntentBaselineKey(event: RawEvent): string {
    return [
        event.type,
        normalizeSelector(event.targetSelector),
        normalizeText(event.label),
        normalizeUrlPath(event.url),
    ].join('|');
}

function buildEventSignature(event: RawEvent): string {
    return [
        event.type,
        normalizeUrlPath(event.url),
        normalizeSelector(event.targetSelector),
        normalizeText(event.label),
    ].join('|');
}

function hasMeaningfulStepSignal(event: RawEvent): boolean {
    if (event.type === 'navigation') return true;
    if (normalizeSelector(event.targetSelector)) return true;
    if (normalizeText(event.label)) return true;
    const payload = event.payload || {};
    if (typeof payload.value === 'string' && payload.value.trim()) return true;
    if (typeof payload.text === 'string' && payload.text.trim()) return true;
    return false;
}

function semanticActionKey(event: RawEvent): 'mutation' | 'click' | 'navigation' | 'other' {
    if (isFormMutationEvent(event)) return 'mutation';
    if (event.type === 'click') return 'click';
    if (event.type === 'navigation') return 'navigation';
    return 'other';
}

function isWeakSelector(selector: string | null | undefined): boolean {
    const s = normalizeSelector(selector);
    if (!s) return true;
    const weak = new Set(['div', 'span', 'p', 'img', 'svg', 'path', 'video', 'canvas', 'body', 'html', '*']);
    if (weak.has(s)) return true;
    if (/^[a-z]+$/.test(s) && s.length <= 6) return true;
    return false;
}

function isUiNoiseClick(event: RawEvent): boolean {
    if (event.type !== 'click') return false;
    const label = normalizeText(event.label);
    const selector = normalizeSelector(event.targetSelector);
    const payload = event.payload || {};
    const role = normalizeText(String(payload.role || ''));

    if (!selector && !label) return true;
    if (selector === 'video' || label === 'video') return true;
    if (isWeakSelector(selector) && (!label || label.length <= 3)) return true;
    if (label && ['tooltip', 'icon', 'tick', 'check', 'close', 'menu', 'dots'].includes(label)) return true;
    if (role && ['presentation', 'img', 'none'].includes(role) && isWeakSelector(selector)) return true;
    return false;
}

function isCancelAction(event: RawEvent): boolean {
    if (event.type !== 'click') return false;
    const label = normalizeText(event.label);
    const selector = normalizeSelector(event.targetSelector);
    return /cancel|cancelar|cerrar|close|dismiss|volver|back/.test(label)
        || /cancel|cancelar|close|dismiss|back/.test(selector);
}

function isCommitAction(event: RawEvent): boolean {
    const label = normalizeText(event.label);
    const selector = normalizeSelector(event.targetSelector);
    if (event.type === 'input' || event.type === 'change') return false;
    return /confirm|confirmar|submit|save|guardar|create|crear|finish|finalizar|send|enviar/.test(label)
        || /confirm|submit|save|create|finish|send/.test(selector);
}

function analyzeFlowSignals(events: RawEvent[]): FlowSignals {
    const skipEventIds = new Set<string>();
    const restrictionByEventId = new Map<string, Record<string, any>>();

    for (const event of events) {
        if (isUiNoiseClick(event)) {
            skipEventIds.add(event.id);
        }
    }

    // If a cancel click is followed by a commit click in a short window,
    // keep the commit and mark it with a "retry/recovery" restriction.
    for (let i = 0; i < events.length; i += 1) {
        const current = events[i];
        if (!isCancelAction(current)) continue;

        for (let j = i + 1; j < events.length; j += 1) {
            const next = events[j];
            const gap = Math.max(0, next.timestampMs - current.timestampMs);
            if (gap > 30000) break;
            if (!isCommitAction(next)) continue;

            skipEventIds.add(current.id);
            const previous = restrictionByEventId.get(next.id) || {};
            restrictionByEventId.set(next.id, {
                ...previous,
                hasPriorCancelledAttempt: true,
                cancelledAttemptEventId: current.id,
            });
            break;
        }
    }

    return { skipEventIds, restrictionByEventId };
}

function normalizeRelevantEvents(events: RawEvent[]): RawEvent[] {
    const relevant = events.filter((event) =>
        event.type === 'click'
        || event.type === 'change'
        || event.type === 'input'
        || event.type === 'navigation');

    const signals = analyzeFlowSignals(relevant);
    const filteredRelevant = relevant.filter((event) => !signals.skipEventIds.has(event.id));

    const deduped: RawEvent[] = [];

    for (const event of filteredRelevant) {
        if (!hasMeaningfulStepSignal(event)) continue;

        const currentSig = buildEventSignature(event);
        const prev = deduped[deduped.length - 1];
        if (!prev) {
            deduped.push(event);
            continue;
        }

        const gap = Math.max(0, event.timestampMs - prev.timestampMs);
        const prevSig = buildEventSignature(prev);
        const prevSelector = normalizeSelector(prev.targetSelector);
        const currentSelector = normalizeSelector(event.targetSelector);

        // Collapse repeated clicks/navigation emitted twice by trackers.
        if ((event.type === 'click' || event.type === 'navigation') && currentSig === prevSig && gap <= 1800) {
            continue;
        }

        // Collapse typing/change bursts on the same field: keep the latest event.
        if ((event.type === 'input' || event.type === 'change')
            && (prev.type === 'input' || prev.type === 'change')
            && normalizeSelector(event.targetSelector)
            && normalizeSelector(event.targetSelector) === normalizeSelector(prev.targetSelector)
            && gap <= 2500) {
            deduped[deduped.length - 1] = event;
            continue;
        }

        // Collapse "click then fill" (or fill then click) on same field/control.
        if (prevSelector && currentSelector && prevSelector === currentSelector && gap <= 4000) {
            // If a click is immediately followed by an input/change in same selector, keep only mutation.
            if (prev.type === 'click' && isFormMutationEvent(event)) {
                deduped[deduped.length - 1] = event;
                continue;
            }
            // If an input/change is followed by click in same selector, drop the click as noise.
            if (isFormMutationEvent(prev) && event.type === 'click') {
                continue;
            }
        }

        deduped.push(event);
    }

    // Second pass: drop noisy clicks around form mutations on same selector
    // even when events are not adjacent (common in real recordings).
    const pruned = deduped.filter((event, index, arr) => {
        if (event.type !== 'click') return true;
        const selector = normalizeSelector(event.targetSelector);
        if (!selector) return true;

        const hasNearbyMutation = arr.some((candidate, candidateIndex) => {
            if (candidateIndex === index) return false;
            if (!isFormMutationEvent(candidate)) return false;
            if (normalizeSelector(candidate.targetSelector) !== selector) return false;
            const gap = Math.abs(candidate.timestampMs - event.timestampMs);
            return gap <= 8000;
        });

        if (hasNearbyMutation) return false;
        return true;
    });

    // Third pass: strict dedupe by selector + semantic action in larger windows.
    const strict: RawEvent[] = [];
    const lastBySemanticSelector = new Map<string, RawEvent>();

    for (const event of pruned) {
        const selector = normalizeSelector(event.targetSelector);
        const semantic = semanticActionKey(event);
        const path = normalizeUrlPath(event.url);

        // Keep navigation events when path changes, ignore route duplicates.
        if (semantic === 'navigation') {
            const lastNav = strict.filter((item) => item.type === 'navigation').at(-1);
            if (lastNav && normalizeUrlPath(lastNav.url) === path && Math.abs(event.timestampMs - lastNav.timestampMs) <= 6000) {
                continue;
            }
            strict.push(event);
            continue;
        }

        if (!selector) {
            strict.push(event);
            continue;
        }

        const mapKey = `${semantic}|${selector}`;
        const previous = lastBySemanticSelector.get(mapKey);
        if (previous) {
            const gap = Math.abs(event.timestampMs - previous.timestampMs);
            // avoid repeating same semantic step on same selector within this window
            if (gap <= 15000) {
                if (semantic === 'mutation') {
                    // keep latest filled value for same selector
                    const idx = strict.findIndex((item) => item.id === previous.id);
                    if (idx >= 0) {
                        strict[idx] = event;
                        lastBySemanticSelector.set(mapKey, event);
                        continue;
                    }
                }
                continue;
            }
        }

        strict.push(event);
        lastBySemanticSelector.set(mapKey, event);
    }

    return strict;
}

function textPreview(text: string, maxLen = 120): string {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.length <= maxLen ? normalized : `${normalized.slice(0, maxLen - 1)}…`;
}

function transcriptSnippetAt(timestampMs: number, segments: TranscriptSegment[]): string {
    if (!segments.length) return '';
    const overlap = segments.find((segment) => timestampMs >= segment.startMs && timestampMs <= segment.endMs);
    if (overlap?.text) return textPreview(overlap.text, 110);
    const nearest = [...segments]
        .sort((a, b) => Math.abs(a.startMs - timestampMs) - Math.abs(b.startMs - timestampMs))[0];
    if (!nearest) return '';
    if (Math.abs(nearest.startMs - timestampMs) > 12000) return '';
    return textPreview(nearest.text, 110);
}

function transcriptSnippetInRange(startMs: number, endMs: number, segments: TranscriptSegment[]): string {
    if (!segments.length) return '';
    const overlapping = segments
        .filter((segment) => !(segment.endMs < startMs || segment.startMs > endMs))
        .map((segment) => segment.text)
        .join(' ')
        .trim();
    return textPreview(overlapping, 180);
}

function normalizeSentence(value: string): string {
    const text = String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/["`]+/g, '"')
        .trim();
    if (!text) return '';
    const withoutLeadingPunctuation = text.replace(/^[,:;.\-–—\s]+/, '').trim();
    if (!withoutLeadingPunctuation) return '';
    const first = withoutLeadingPunctuation.charAt(0).toUpperCase();
    let normalized = `${first}${withoutLeadingPunctuation.slice(1)}`;
    if (!/[.!?…]$/.test(normalized)) normalized = `${normalized}.`;
    return normalized;
}

function isLikelyMultiStepDescription(value: string): boolean {
    const text = normalizeText(value);
    if (!text) return false;
    const connectors = (text.match(/\b(luego|despues|después|then|after|posteriormente|finalmente)\b/g) || []).length;
    const actionVerbs = (text.match(/\b(click|clic|llenamos|ingresamos|seleccionamos|confirmamos|creamos|escribimos|elegimos|terminamos)\b/g) || []).length;
    const commaCount = (text.match(/,/g) || []).length;
    return (connectors >= 1 && actionVerbs >= 2) || (commaCount >= 2 && actionVerbs >= 2);
}

function isWeakNarrationText(value: string): boolean {
    const text = normalizeText(value);
    if (!text) return true;
    const words = text.split(' ').filter(Boolean);
    if (words.length < 4) return true;
    if (/^(luego|despues|después|entonces|y|and)\b/.test(text)) return true;
    return false;
}

function humanizeTarget(event: RawEvent): string {
    const label = String(event.label || '').trim();
    if (label) return label;
    const selector = String(event.targetSelector || '').trim();
    if (!selector) return 'elemento';
    if (selector.startsWith('#')) return selector.slice(1).replace(/[-_]/g, ' ');
    return selector.replace(/[.#\[\]"'=]/g, ' ').replace(/\s+/g, ' ').trim() || 'elemento';
}

function canonicalStepDescription(event: RawEvent): string {
    const target = humanizeTarget(event);
    if (event.type === 'click') return normalizeSentence(`Haz clic en ${target}.`);
    if (event.type === 'input' || event.type === 'change') return normalizeSentence(`Completa el campo ${target}.`);
    if (event.type === 'navigation') return normalizeSentence(`Navega a la siguiente pantalla del flujo.`);
    return normalizeSentence(`Interactúa con ${target}.`);
}

function cleanSpokenExtract(value: string): string {
    const raw = normalizeSentence(value);
    if (!raw) return '';
    const stripped = raw
        .replace(/^(luego|despues|después|entonces|y)\b[:,\s]*/i, '')
        .replace(/\b(luego|despues|después|entonces)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    const firstClause = stripped.split(/[;|]/)[0]?.trim() || '';
    return normalizeSentence(firstClause);
}

const stepSemanticRefineSchema = z.object({
    steps: z.array(z.object({
        order: z.number().int().min(1),
        description: z.string().min(3).max(280),
    })).min(1),
});

async function refineStepDescriptionsSemantically(input: {
    orgId: string;
    projectId: string;
    intent: string | null;
    transcriptText: string;
    transcriptSegments: TranscriptSegment[];
    intentMapEntries: Array<Record<string, any>>;
    stepCandidates: Array<{
        order: number;
        title: string;
        description: string;
        targetSelector: string | null;
        timestampMs: number;
        metadata: Record<string, any>;
    }>;
}): Promise<Map<number, string>> {
    const llm = await resolveLLM(input.orgId, input.projectId);
    const stepsPayload = input.stepCandidates.map((step) => ({
        order: step.order,
        title: step.title,
        description: step.description,
        targetSelector: step.targetSelector,
        timestampMs: step.timestampMs,
        interactionMap: step.metadata?.interactionMap || null,
        intentBaseline: step.metadata?.intentBaseline || null,
    }));

    const prompt = [
        'Eres un analista semántico de guías tipo Loom.',
        'Debes asignar una descripción clara por paso usando tiempos y contexto.',
        'Reglas estrictas:',
        '- 1 paso = 1 acción/intención. No combines dos pasos en una sola descripción.',
        '- Usa los tiempos del step y de transcript para decidir qué texto corresponde.',
        '- No empieces frases con "Luego", "Entonces", "Después".',
        '- Evita texto cortado o de transición.',
        '- Mantén español natural y concreto.',
        '',
        `Intento del usuario: ${input.intent || 'N/A'}`,
        'Transcript completo:',
        input.transcriptText || 'N/A',
        'Segmentos transcript (JSON):',
        JSON.stringify(input.transcriptSegments.slice(0, 220)),
        'Intent map (JSON):',
        JSON.stringify(input.intentMapEntries.slice(0, 160)),
        'Steps candidatos (JSON):',
        JSON.stringify(stepsPayload),
        'Devuelve SOLO descriptions corregidas por order.',
    ].join('\n');

    const result = await llm.structured(prompt, stepSemanticRefineSchema, {
        system: 'No inventes acciones no observadas. Respeta el orden de steps existente.',
    });

    const map = new Map<number, string>();
    for (const step of result.steps) {
        const cleaned = normalizeSentence(step.description);
        if (!cleaned) continue;
        map.set(step.order, cleaned);
    }
    return map;
}

function buildInteractionMap(
    relevantEvents: RawEvent[],
    transcriptSegments: TranscriptSegment[],
    chapters: Array<{ startMs: number; endMs: number; title: string }>
): Map<string, InteractionMappedStep> {
    const map = new Map<string, InteractionMappedStep>();
    if (!relevantEvents.length) return map;

    const stepSegmentTexts = new Map<string, string[]>();
    const stepSegmentRanges = new Map<string, { minStart: number | null; maxEnd: number | null; count: number }>();
    const stepChunkSegments = new Map<string, Array<{ startMs: number; endMs: number; text: string }>>();
    const stepOverlapStats = new Map<string, { overlapMs: number; segmentMs: number }>();

    const windows = relevantEvents.map((event, index) => {
        const prevTs = index > 0 ? relevantEvents[index - 1].timestampMs : event.timestampMs;
        const nextTs = index < relevantEvents.length - 1 ? relevantEvents[index + 1].timestampMs : event.timestampMs + 8000;
        const midpointPrev = index > 0 ? Math.floor((prevTs + event.timestampMs) / 2) : Math.max(0, event.timestampMs - 2500);
        const midpointNext = index < relevantEvents.length - 1
            ? Math.floor((event.timestampMs + nextTs) / 2)
            : event.timestampMs + 8000;

        // Keep a short tail after each interaction because narration usually trails the click.
        const windowStart = Math.max(0, midpointPrev - 800);
        const windowEnd = Math.max(windowStart + 1200, midpointNext + 2200);
        return { eventId: event.id, windowStart, windowEnd };
    });

    for (const segment of transcriptSegments) {
        let assignedEventId: string | null = null;
        let bestOverlapMs = 0;

        for (const window of windows) {
            const overlapStart = Math.max(segment.startMs, window.windowStart);
            const overlapEnd = Math.min(segment.endMs, window.windowEnd);
            const overlapMs = Math.max(0, overlapEnd - overlapStart);
            if (overlapMs > bestOverlapMs) {
                bestOverlapMs = overlapMs;
                assignedEventId = window.eventId;
            }
        }

        // Fallback to nearest step window when there is no overlap.
        if (!assignedEventId || bestOverlapMs <= 0) {
            const segmentCenter = Math.floor((segment.startMs + segment.endMs) / 2);
            let bestDistance = Number.POSITIVE_INFINITY;
            assignedEventId = null;
            for (const window of windows) {
                const distance = segmentCenter < window.windowStart
                    ? window.windowStart - segmentCenter
                    : segmentCenter > window.windowEnd
                        ? segmentCenter - window.windowEnd
                        : 0;
                if (distance < bestDistance) {
                    bestDistance = distance;
                    assignedEventId = window.eventId;
                }
            }
            if (bestDistance > 12000) assignedEventId = null;
        }

        if (!assignedEventId) continue;
        const text = textPreview(segment.text, 140);
        if (text) {
            const current = stepSegmentTexts.get(assignedEventId) || [];
            current.push(text);
            stepSegmentTexts.set(assignedEventId, current);
        }
        const assignedWindow = windows.find((item) => item.eventId === assignedEventId);
        if (assignedWindow) {
            const overlapStart = Math.max(segment.startMs, assignedWindow.windowStart);
            const overlapEnd = Math.min(segment.endMs, assignedWindow.windowEnd);
            const overlapMs = Math.max(0, overlapEnd - overlapStart);
            const segmentMs = Math.max(1, segment.endMs - segment.startMs);
            const current = stepOverlapStats.get(assignedEventId) || { overlapMs: 0, segmentMs: 0 };
            current.overlapMs += overlapMs;
            current.segmentMs += segmentMs;
            stepOverlapStats.set(assignedEventId, current);
        }
        const chunks = stepChunkSegments.get(assignedEventId) || [];
        chunks.push({
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: textPreview(segment.text, 160),
        });
        stepChunkSegments.set(assignedEventId, chunks);
        const currentRange = stepSegmentRanges.get(assignedEventId) || { minStart: null, maxEnd: null, count: 0 };
        currentRange.minStart = currentRange.minStart == null ? segment.startMs : Math.min(currentRange.minStart, segment.startMs);
        currentRange.maxEnd = currentRange.maxEnd == null ? segment.endMs : Math.max(currentRange.maxEnd, segment.endMs);
        currentRange.count += 1;
        stepSegmentRanges.set(assignedEventId, currentRange);
    }

    for (const event of relevantEvents) {
        const window = windows.find((item) => item.eventId === event.id);
        const chapterIndex = Math.max(
            0,
            chapters.findIndex((chapter) => event.timestampMs >= chapter.startMs && event.timestampMs <= chapter.endMs)
        );
        const chapterTitle = chapters[chapterIndex]?.title || `Chapter ${chapterIndex + 1}`;

        const assignedTexts = (stepSegmentTexts.get(event.id) || [])
            .map((item) => normalizeSentence(item))
            .filter(Boolean);
        const dedupedTexts = Array.from(new Set(assignedTexts.map((item) => normalizeText(item))))
            .map((normalized) => assignedTexts.find((item) => normalizeText(item) === normalized))
            .filter(Boolean) as string[];

        const transcriptText = dedupedTexts.length > 0
            ? textPreview(dedupedTexts.join(' '), 220)
            : normalizeSentence(transcriptSnippetAt(event.timestampMs, transcriptSegments));
        const range = stepSegmentRanges.get(event.id);
        const chunks = (stepChunkSegments.get(event.id) || []).slice(0, 10);
        const overlap = stepOverlapStats.get(event.id);
        const mappingConfidence = overlap && overlap.segmentMs > 0
            ? Math.max(0, Math.min(1, overlap.overlapMs / overlap.segmentMs))
            : 0;

        map.set(event.id, {
            eventId: event.id,
            timestampMs: event.timestampMs,
            chapterIndex,
            chapterTitle,
            transcriptText,
            transcriptWindowStartMs: window?.windowStart ?? event.timestampMs,
            transcriptWindowEndMs: window?.windowEnd ?? (event.timestampMs + 4000),
            transcriptSegmentStartMs: range?.minStart ?? null,
            transcriptSegmentEndMs: range?.maxEnd ?? null,
            transcriptSegmentCount: range?.count ?? 0,
            transcriptChunks: chunks,
            mappingConfidence,
        });
    }

    return map;
}

function buildSyntheticSegmentsFromTranscript(transcriptText: string, durationMs: number): TranscriptSegment[] {
    const cleaned = String(transcriptText || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];

    const sentenceParts = cleaned
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

    const chunks = sentenceParts.length > 1
        ? sentenceParts
        : cleaned.split(/\s+/).reduce<string[]>((acc, word) => {
            if (!acc.length) {
                acc.push(word);
                return acc;
            }
            const idx = acc.length - 1;
            const currentWords = acc[idx].split(/\s+/).length;
            if (currentWords >= 12) {
                acc.push(word);
            } else {
                acc[idx] = `${acc[idx]} ${word}`;
            }
            return acc;
        }, []);

    const safeDuration = Math.max(durationMs, chunks.length * 1200, 5000);
    const slot = Math.floor(safeDuration / Math.max(chunks.length, 1));

    return chunks.map((text, index) => {
        const startMs = index * slot;
        const endMs = index === chunks.length - 1
            ? safeDuration
            : Math.max(startMs + 900, (index + 1) * slot);
        return { startMs, endMs, text };
    });
}

function confidenceFromSelector(selector: string | null): number {
    if (!selector) return 35;
    if (selector.startsWith('#')) return 92;
    if (selector.includes('data-testid')) return 84;
    if (selector.includes('[name=')) return 78;
    if (selector.includes('.')) return 65;
    return 55;
}

function eventToStepTitle(event: RawEvent): string {
    if (event.type === 'navigation') {
        return `Navigate to ${event.url || 'next page'}`;
    }
    if (event.type === 'change' || event.type === 'input') {
        return `Fill ${event.label || event.targetSelector || 'field'}`;
    }
    if (event.type === 'click') {
        return `Click ${event.label || event.targetSelector || 'target'}`;
    }
    return `Interact with ${event.targetSelector || 'element'}`;
}

function eventToStepDescription(event: RawEvent, transcriptSegments: TranscriptSegment[], mappedText?: string): string {
    const spoken = normalizeSentence(mappedText || transcriptSnippetAt(event.timestampMs, transcriptSegments));
    if (spoken) return spoken;

    if (event.type === 'navigation') {
        return event.url ? `Navigate to ${event.url}` : 'Navigate to next page';
    }

    if (event.type === 'change' || event.type === 'input') {
        return event.label || event.targetSelector || 'Fill field';
    }

    if (event.type === 'click') {
        return event.label ? `Click ${event.label}` : (event.targetSelector || 'Click target');
    }

    return event.label || event.targetSelector || 'Perform interaction';
}

function buildChapters(events: RawEvent[], transcriptSegments: TranscriptSegment[]) {
    if (!events.length) return [] as Array<{ startMs: number; endMs: number; title: string; summary: string }>;

    const chapters: Array<{ startMs: number; endMs: number; title: string; summary: string }> = [];
    let currentStart = events[0].timestampMs;
    let currentEvents: RawEvent[] = [events[0]];

    for (let i = 1; i < events.length; i += 1) {
        const prev = events[i - 1];
        const event = events[i];
        const gap = Math.max(0, event.timestampMs - prev.timestampMs);
        const shouldSplit = event.type === 'navigation' || gap > 20000;

        if (!shouldSplit) {
            currentEvents.push(event);
            continue;
        }

        const first = currentEvents[0];
        const last = currentEvents[currentEvents.length - 1];
        const clicks = currentEvents.filter((item) => item.type === 'click').length;
        const changes = currentEvents.filter((item) => item.type === 'change' || item.type === 'input').length;
        const spoken = transcriptSnippetInRange(currentStart, last.timestampMs, transcriptSegments);
        chapters.push({
            startMs: currentStart,
            endMs: last.timestampMs,
            title: first.label || first.targetSelector || `Chapter ${chapters.length + 1}`,
            summary: spoken
                ? `${currentEvents.length} events · ${clicks} clicks · ${changes} inputs · "${spoken}"`
                : `${currentEvents.length} events · ${clicks} clicks · ${changes} inputs`,
        });

        currentStart = event.timestampMs;
        currentEvents = [event];
    }

    if (currentEvents.length > 0) {
        const first = currentEvents[0];
        const last = currentEvents[currentEvents.length - 1];
        const clicks = currentEvents.filter((item) => item.type === 'click').length;
        const changes = currentEvents.filter((item) => item.type === 'change' || item.type === 'input').length;
        const spoken = transcriptSnippetInRange(currentStart, last.timestampMs, transcriptSegments);
        chapters.push({
            startMs: currentStart,
            endMs: last.timestampMs,
            title: first.label || first.targetSelector || `Chapter ${chapters.length + 1}`,
            summary: spoken
                ? `${currentEvents.length} events · ${clicks} clicks · ${changes} inputs · "${spoken}"`
                : `${currentEvents.length} events · ${clicks} clicks · ${changes} inputs`,
        });
    }

    return chapters;
}

export async function processObserverSession(sessionId: string): Promise<void> {
    const [session] = await db
        .select({
            id: observerSessions.id,
            status: observerSessions.status,
            videoS3Key: observerSessions.videoS3Key,
            projectId: observerSessions.projectId,
            videoDurationMs: observerSessions.videoDurationMs,
            intent: observerSessions.intent,
            processingSummary: observerSessions.processingSummary,
        })
        .from(observerSessions)
        .where(eq(observerSessions.id, sessionId))
        .limit(1);

    if (!session) throw new Error('Observer session not found');
    if (session.status !== 'uploaded' && session.status !== 'processing') return;

    await db
        .update(observerSessions)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(observerSessions.id, sessionId));

    const events = await db
        .select({
            id: observerEvents.id,
            type: observerEvents.type,
            timestampMs: observerEvents.timestampMs,
            url: observerEvents.url,
            targetSelector: observerEvents.targetSelector,
            label: observerEvents.label,
            payload: observerEvents.payload,
        })
        .from(observerEvents)
        .where(eq(observerEvents.observerSessionId, sessionId))
        .orderBy(asc(observerEvents.timestampMs)) as RawEvent[];

    const preRelevant = events.filter((event) =>
        event.type === 'click'
        || event.type === 'change'
        || event.type === 'input'
        || event.type === 'navigation');
    const flowSignals = analyzeFlowSignals(preRelevant);
    const relevant = normalizeRelevantEvents(events);

    const teamOrchestrator = new ObserverProcessingTeamOrchestrator();
    const transcriptionResult = await teamOrchestrator.runTranscription({
        projectId: session.projectId,
        videoS3Key: session.videoS3Key,
    });

    const transcription =
        transcriptionResult.transcript as
        | {
            transcriptText: string;
            segments: TranscriptSegment[];
            provider: string;
            model: string;
        }
        | null;
    const transcriptStatus = transcriptionResult.status;
    const rawTranscriptSegments = transcription?.segments || [];
    const maxEventTimestamp = events.length > 0 ? Math.max(...events.map((event) => event.timestampMs)) : 0;
    const estimatedDuration = Math.max(session.videoDurationMs || 0, maxEventTimestamp);
    const transcriptSegments = rawTranscriptSegments.length > 0
        ? rawTranscriptSegments
        : (transcription?.transcriptText
            ? buildSyntheticSegmentsFromTranscript(transcription.transcriptText, estimatedDuration)
            : []);

    const chapters = buildChapters(events, transcriptSegments);
    const interactionMap = buildInteractionMap(relevant, transcriptSegments, chapters);
    const pipelineMode = (process.env.LUMEN_CANDIDATE_PIPELINE || 'enhanced').toLowerCase();
    const useEnhancedChunkTranscription = pipelineMode === 'enhanced';
    let stepChunkTranscription: Awaited<ReturnType<typeof transcribeStepWindows>> = {
        byEventId: new Map(),
        status: {
            enabled: false,
            ok: false,
            used: false,
            reason: 'pipeline_simple_mode',
        },
    };

    if (useEnhancedChunkTranscription) {
        const stepChunkTimeoutMs = Number(process.env.LUMEN_STEP_CHUNK_TIMEOUT_MS || 90000);
        stepChunkTranscription = await Promise.race([
            transcribeStepWindows({
                videoS3Key: session.videoS3Key,
                windows: relevant.map((event) => {
                    const mapping = interactionMap.get(event.id);
                    return {
                        eventId: event.id,
                        startMs: mapping?.transcriptWindowStartMs ?? event.timestampMs,
                        endMs: mapping?.transcriptWindowEndMs ?? (event.timestampMs + 3500),
                    };
                }),
            }),
            new Promise<Awaited<ReturnType<typeof transcribeStepWindows>>>((resolve) => {
                setTimeout(() => {
                    resolve({
                        byEventId: new Map(),
                        status: {
                            enabled: true,
                            ok: false,
                            used: false,
                            reason: 'step_chunk_race_timeout',
                        },
                    });
                }, stepChunkTimeoutMs);
            }),
        ]);

        // If chunk transcription is available, prioritize it as step-level spoken text source.
        for (const event of relevant) {
            const mapped = interactionMap.get(event.id);
            if (!mapped) continue;
            const byChunk = stepChunkTranscription.byEventId.get(event.id);
            if (!byChunk?.text) continue;
            mapped.transcriptText = byChunk.text;
            if (byChunk.chunks?.length) {
                mapped.transcriptChunks = byChunk.chunks;
                mapped.transcriptSegmentCount = byChunk.chunks.length;
                mapped.transcriptSegmentStartMs = byChunk.chunks[0].startMs;
                mapped.transcriptSegmentEndMs = byChunk.chunks[byChunk.chunks.length - 1].endMs;
            }
        }
    }

    const intentEntries = (((session.processingSummary as Record<string, any>)?.intentMap?.entries) || []) as Array<Record<string, any>>;
    const intentByKey = new Map<string, Record<string, any>>();
    for (const entry of intentEntries) {
        if (entry?.key) intentByKey.set(String(entry.key), entry);
    }
    const usedDescriptionKeys = new Set<string>();

    const stepCandidates: Array<{
        observerSessionId: string;
        order: number;
        title: string;
        description: string;
        targetSelector: string | null;
        timestampMs: number;
        confidence: number;
        metadata: Record<string, any>;
    }> = [];
    const recentDescriptions = new Map<string, number>();

    for (let index = 0; index < relevant.length; index += 1) {
        const event = relevant[index];
        const mapping = interactionMap.get(event.id);
        const intentBaseline = intentByKey.get(buildIntentBaselineKey(event)) || null;
        const restrictionHints = flowSignals.restrictionByEventId.get(event.id) || null;
        const mappingConfidence = typeof mapping?.mappingConfidence === 'number' ? mapping.mappingConfidence : 0;
        const mappedText = mappingConfidence >= 0.45 ? String(mapping?.transcriptText || '') : '';
        const mappedTextIsWeak = isWeakNarrationText(mappedText);
        const spokenExtract = cleanSpokenExtract(mappedTextIsWeak && mappingConfidence < 0.8 ? '' : mappedText);
        let description = canonicalStepDescription(event);

        if (!description) {
            description = eventToStepDescription(event, transcriptSegments);
        }

        const selectorKey = normalizeSelector(event.targetSelector);
        const descKeyBase = `${selectorKey}|${normalizeText(description)}`;

        if (descKeyBase.endsWith('|') || usedDescriptionKeys.has(descKeyBase)) {
            description = eventToStepDescription(event, transcriptSegments);
        }

        // Cross-step dedupe: avoid repeating same narration in nearby steps.
        const normalizedDescription = normalizeText(description);
        const previousAt = recentDescriptions.get(normalizedDescription);
        if (previousAt !== undefined && index - previousAt <= 3) {
            const fallback = eventToStepDescription(event, transcriptSegments);
            if (normalizeText(fallback) !== normalizedDescription) {
                description = fallback;
            } else {
                description = normalizeSentence(event.label || event.targetSelector || eventToStepTitle(event));
            }
        }

        const finalDescKey = `${selectorKey}|${normalizeText(description)}`;
        if (finalDescKey) usedDescriptionKeys.add(finalDescKey);
        if (normalizeText(description)) recentDescriptions.set(normalizeText(description), index);

        stepCandidates.push({
            observerSessionId: sessionId,
            order: index + 1,
            title: eventToStepTitle(event),
            description,
            targetSelector: event.targetSelector || null,
            timestampMs: event.timestampMs,
            confidence: confidenceFromSelector(event.targetSelector),
            metadata: {
                sourceEventId: event.id,
                type: event.type,
                url: event.url,
                label: event.label,
                transcriptSnippet: transcriptSnippetAt(event.timestampMs, transcriptSegments),
                interactionMap: mapping || null,
                intentBaseline,
                restrictionHints,
                descriptionSource: mappedText && !mappedTextIsWeak ? 'step_chunk_or_window' : 'fallback_event_or_nearest',
                descriptionMappingConfidence: mappingConfidence,
                spokenExtract: (!isWeakNarrationText(spokenExtract) && !isLikelyMultiStepDescription(spokenExtract)) ? spokenExtract : null,
                payload: event.payload || {},
            },
        });
    }

    // Semantic AI pass: re-assign one coherent description per step using transcript + intent map + timing.
    try {
        const [projectRow] = await db
            .select({ organizationId: projects.organizationId })
            .from(projects)
            .where(eq(projects.id, session.projectId))
            .limit(1);

        const orgId = projectRow?.organizationId;
        const transcriptText = String(transcription?.transcriptText || '').trim();
        const intentMapEntries = (((session.processingSummary as Record<string, any>)?.intentMap?.entries) || []) as Array<Record<string, any>>;

        if (orgId && stepCandidates.length > 0 && (transcriptSegments.length > 0 || transcriptText)) {
            const refined = await refineStepDescriptionsSemantically({
                orgId,
                projectId: session.projectId,
                intent: session.intent || null,
                transcriptText,
                transcriptSegments,
                intentMapEntries,
                stepCandidates: stepCandidates.map((step) => ({
                    order: step.order,
                    title: step.title,
                    description: step.description,
                    targetSelector: step.targetSelector,
                    timestampMs: step.timestampMs,
                    metadata: step.metadata,
                })),
            });

            const seen = new Set<string>();
            for (const step of stepCandidates) {
                const candidate = refined.get(step.order);
                if (!candidate) continue;
                const normalized = normalizeText(candidate);
                if (!normalized) continue;
                if (seen.has(normalized)) continue;
                if (isLikelyMultiStepDescription(candidate)) continue;
                if (isWeakNarrationText(candidate)) continue;
                seen.add(normalized);
                // Keep canonical actionable descriptions for steps.
                // AI semantic pass is used only to improve spoken extract alignment.
                const refinedSpoken = cleanSpokenExtract(candidate);
                if (refinedSpoken && !isWeakNarrationText(refinedSpoken) && !isLikelyMultiStepDescription(refinedSpoken)) {
                    step.metadata = {
                        ...(step.metadata || {}),
                        spokenExtract: refinedSpoken,
                    };
                }
                step.metadata = {
                    ...(step.metadata || {}),
                    semanticRefined: true,
                };
            }
        }
    } catch (error) {
        console.warn('[ObserverProcessing] semantic step description refinement failed:', (error as Error)?.message || error);
    }

    await db.delete(observerChapters).where(eq(observerChapters.observerSessionId, sessionId));
    await db.delete(observerStepCandidates).where(eq(observerStepCandidates.observerSessionId, sessionId));

    if (chapters.length > 0) {
        await db.insert(observerChapters).values(chapters.map((chapter) => ({
            observerSessionId: sessionId,
            startMs: chapter.startMs,
            endMs: chapter.endMs,
            title: chapter.title,
            summary: chapter.summary,
        })));
    }

    if (stepCandidates.length > 0) {
        await db.insert(observerStepCandidates).values(stepCandidates);
    }

    await db
        .update(observerSessions)
        .set({
            status: 'ready_for_review',
            processingSummary: {
                ...((session.processingSummary as Record<string, any>) || {}),
                eventCount: events.length,
                filteredEventCount: relevant.length,
                skippedEventCount: flowSignals.skipEventIds.size,
                chapterCount: chapters.length,
                stepCandidatesCount: stepCandidates.length,
                transcript: transcription
                    ? {
                        status: transcriptStatus.status,
                        provider: transcription.provider,
                        model: transcription.model,
                        source: transcriptStatus.source,
                        segmentsCount: transcriptSegments.length,
                        preview: textPreview(transcription.transcriptText, 240),
                    }
                    : transcriptStatus,
                interactionMapCount: interactionMap.size,
                pipelineMode,
                stepChunkTranscription: stepChunkTranscription.status,
                processedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
        })
        .where(and(eq(observerSessions.id, sessionId), eq(observerSessions.status, 'processing')));
}

export function scheduleObserverSessionProcessing(sessionId: string) {
    setTimeout(() => {
        processObserverSession(sessionId).catch(async (error) => {
            console.error('[ObserverProcessing] failed for session', sessionId, error);
            await db.update(observerSessions).set({
                status: 'failed',
                processingSummary: {
                    error: (error as Error)?.message || 'Unknown processing error',
                    failedAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
            }).where(eq(observerSessions.id, sessionId));
        });
    }, 0);
}
