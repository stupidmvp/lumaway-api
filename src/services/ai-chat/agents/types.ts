import { z } from 'zod';
import type { LLMService } from '../../../adapters/ai/llm.service';

export type AgentResponseType = 'answer' | 'guide' | 'clarify';

export interface PublishedWalkthrough {
    id: string;
    title: string;
    description?: string | null;
    steps: any[];
    tags?: any;
    parentId?: string | null;
    previousWalkthroughId?: string | null;
    nextWalkthroughId?: string | null;
}

export interface TeamRequesterContext {
    userId: string;
    actorSlug?: string;
    locale?: string;
    sessionId?: string;
    userName?: string;
}

export interface AnonymousProfileContext {
    isAnonymous: boolean;
    userTurns: number;
    userName?: string;
    shouldAskName: boolean;
}

export interface TeamInput {
    userMessage: string;
    lastAssistantMessage?: string;
    lastUserMessage?: string;
    assistantName: string;
    assistantSystemPrompt?: string;
    languageHint: string;
    conversationContext: string;
    requesterContext: TeamRequesterContext;
    anonymousProfile: AnonymousProfileContext;
    walkthroughs: PublishedWalkthrough[];
    contextSummary: string;
    llm: LLMService;
    systemPrompt: string;
    streamCallbacks?: {
        onResponsePartial?: (partial: string, delta: string) => void;
    };
}

export interface IdentityDecision {
    hasProvidedName: boolean;
    providedName?: string;
}

export interface IntentDecision {
    intent: string;
    responseType: AgentResponseType;
    confidence: number;
}

export interface PlannerDecision {
    allow: boolean;
    category: 'safe' | 'abuse' | 'uncertain';
    reason: string;
    safeMessage?: string;
    intent: string;
    responseType: AgentResponseType;
    confidence: number;
    suggestedWalkthroughIds: string[];
}

export interface SecurityDecision {
    allow: boolean;
    category: 'safe' | 'abuse' | 'uncertain';
    reason: string;
    safeMessage?: string;
}

export interface RetrievalDecision {
    suggestedWalkthroughIds: string[];
}

export interface ResponseDecision {
    responseType: AgentResponseType;
    message: string;
}

export const intentDecisionSchema = z.object({
    intent: z.string(),
    responseType: z.enum(['answer', 'guide', 'clarify']),
    confidence: z.number().min(0).max(1),
});

export const plannerDecisionSchema = z.object({
    allow: z.boolean(),
    category: z.enum(['safe', 'abuse', 'uncertain']),
    reason: z.string(),
    safeMessage: z.string().optional(),
    intent: z.string(),
    responseType: z.enum(['answer', 'guide', 'clarify']),
    confidence: z.number().min(0).max(1),
    suggestedWalkthroughIds: z.array(z.string()).max(3),
});

export const retrievalDecisionSchema = z.object({
    suggestedWalkthroughIds: z.array(z.string()).max(3),
});

export const responseDecisionSchema = z.object({
    responseType: z.enum(['answer', 'guide', 'clarify']),
    message: z.string().min(1),
});

export const securityDecisionSchema = z.object({
    allow: z.boolean(),
    category: z.enum(['safe', 'abuse', 'uncertain']),
    reason: z.string(),
    safeMessage: z.string().optional(),
});

export const identityDecisionSchema = z.object({
    hasProvidedName: z.boolean(),
    providedName: z.string().min(1).max(60).optional(),
});
