"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatTeamOrchestrator = void 0;
const planner_agent_1 = require("./planner-agent");
const response_agent_1 = require("./response-agent");
class AiChatTeamOrchestrator {
    constructor(plannerAgent = new planner_agent_1.PlannerAgent(), responseAgent = new response_agent_1.ResponseAgent()) {
        this.plannerAgent = plannerAgent;
        this.responseAgent = responseAgent;
    }
    async run(input) {
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
        const response = await this.responseAgent.run(input, {
            intent: planner.intent,
            responseType: planner.responseType,
            confidence: planner.confidence,
        }, {
            suggestedWalkthroughIds: planner.suggestedWalkthroughIds,
        });
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
exports.AiChatTeamOrchestrator = AiChatTeamOrchestrator;
