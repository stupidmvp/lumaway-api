"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiProvider = exports.OpenAIProvider = void 0;
const openai_1 = require("@ai-sdk/openai");
const bottleneck_1 = __importDefault(require("bottleneck"));
/**
 * OpenAIProvider - OpenAI LLM implementation.
 *
 * No free tier — requires user-provided API key.
 * Available for Pro (with LumaWay key) and Enterprise (with org/project key).
 */
class OpenAIProvider {
    constructor() {
        this.name = 'openai';
        this.paidLimiter = new bottleneck_1.default({ maxConcurrent: 10, minTime: 100 });
    }
    async getModel(config) {
        if (!config?.apiKey) {
            throw new Error('OpenAI provider requires an API key (not available in free tier)');
        }
        const modelId = config.modelId ?? 'gpt-4o-mini';
        const openai = (0, openai_1.createOpenAI)({ apiKey: config.apiKey });
        return openai(modelId);
    }
    getLimiter(_tier = 'paid') {
        return this.paidLimiter;
    }
}
exports.OpenAIProvider = OpenAIProvider;
exports.openaiProvider = new OpenAIProvider();
