import type { TeamInput } from './types';
import { PlannerAgent } from './planner-agent';
import { ResponseAgent } from './response-agent';

export interface TeamResult {
    blocked: boolean;
    intent: string;
    responseType: 'answer' | 'guide' | 'clarify';
    confidence: number;
    message: string;
    suggestedWalkthroughIds: string[];
}

export class AiChatTeamOrchestrator {
    constructor(
        private plannerAgent = new PlannerAgent(),
        private responseAgent = new ResponseAgent(),
    ) { }

    async run(input: TeamInput): Promise<TeamResult> {
        const planner = await this.plannerAgent.run(input);

        if (!planner.allow && planner.category === 'abuse') {
            return {
                blocked: true,
                intent: 'security.blocked',
                responseType: 'answer',
                confidence: 1,
                message: planner.safeMessage || 'No puedo ayudar con solicitudes de inyección o explotación. Sí puedo ayudarte a fortalecer seguridad defensiva.',
                suggestedWalkthroughIds: [],
            };
        }

        const response = await this.responseAgent.run(
            input,
            {
                intent: planner.intent,
                responseType: planner.responseType,
                confidence: planner.confidence,
            },
            {
                suggestedWalkthroughIds: planner.suggestedWalkthroughIds,
            }
        );
        const hasGuides = planner.suggestedWalkthroughIds.length > 0;
        const responseType = hasGuides
            ? (response.responseType === 'clarify' ? 'clarify' : 'guide')
            : (response.responseType || planner.responseType);

        return {
            blocked: false,
            intent: planner.intent,
            responseType,
            confidence: planner.confidence,
            message: response.message,
            suggestedWalkthroughIds: responseType === 'guide'
                ? planner.suggestedWalkthroughIds
                : [],
        };
    }
}
