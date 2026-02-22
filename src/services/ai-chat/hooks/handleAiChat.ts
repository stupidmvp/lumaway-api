import { db } from '../../../adapters';
import { apiKeys, projects, walkthroughs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveLLM } from '../../../adapters/ai/llm-resolver';
import { conversationStore } from '../conversation.store';
import { AiChatTeamOrchestrator } from '../agents/team-orchestrator';
import { IdentityAgent } from '../agents/identity-agent';
import type { TeamRequesterContext } from '../agents/types';

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

function getRequesterContext(context: any): TeamRequesterContext {
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
    const locale = typeof localeHeader === 'string' && localeHeader.trim()
        ? localeHeader.trim()
        : undefined;
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
    const requester = getRequesterContext(context);

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

    const conversationHistory = conversationStore.formatHistory(projectId, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
        assistantName,
    });
    const priorMessages = conversationStore.getHistory(projectId, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });
    const lastAssistantMessage = [...priorMessages].reverse().find((m) => m.role === 'assistant')?.content;
    const lastUserMessage = [...priorMessages].reverse().find((m) => m.role === 'user')?.content;
    const conversationContext = conversationHistory
        ? `Historial de conversación:\n${conversationHistory}\n\n`
        : '';

    conversationStore.addMessage(projectId, 'user', message.trim(), {
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
                const target = step?.target ? ` [target: ${step.target}]` : '';
                summary += `\n    · ${title}${target}: ${desc || '—'}`;
            }
        }
        return summary;
    }).join('\n\n');

    const llm = await resolveLLM(orgId, projectId);
    const systemPrompt = buildSystemPrompt(assistantName, assistantSystemPrompt);
    const languageHint = detectResponseLanguage(message.trim());
    const orchestrator = new AiChatTeamOrchestrator();
    const identityAgent = new IdentityAgent();

    const isAnonymous = requester.userId === 'anonymous';
    let profile = conversationStore.getProfile(projectId, {
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
            conversationStore.setUserName(projectId, identity.providedName, {
                userId: requester.userId,
                actorSlug: requester.actorSlug,
                sessionId: requester.sessionId,
            });
            profile = conversationStore.getProfile(projectId, {
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

    const actions: Array<{ label: string; walkthroughId: string; stepId: string }> = [];

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
    }

    const responseMessage = teamResult.message || buildMinimalContextFallback(projectWalkthroughs as any);

    conversationStore.addMessage(projectId, 'assistant', responseMessage, {
        userId: requester.userId,
        actorSlug: requester.actorSlug,
        sessionId: requester.sessionId,
    });

    context.result = {
        message: responseMessage,
        walkthroughsUsed: projectWalkthroughs.length,
        ...(actions.length > 0 ? { actions } : {}),
    };

    return context;
};
