"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropicProvider = exports.AnthropicProvider = void 0;
const anthropic_1 = require("@ai-sdk/anthropic");
const bottleneck_1 = __importDefault(require("bottleneck"));
/**
 * AnthropicProvider - Anthropic Claude LLM implementation.
 *
 * No free tier — requires user-provided API key.
 * Available for Enterprise tier with org/project key.
 */
class AnthropicProvider {
    constructor() {
        this.name = 'anthropic';
        this.paidLimiter = new bottleneck_1.default({ maxConcurrent: 10, minTime: 100 });
    }
    async getModel(config) {
        if (!config?.apiKey) {
            throw new Error('Anthropic provider requires an API key (not available in free tier)');
        }
        const modelId = config.modelId ?? 'claude-sonnet-4-20250514';
        const anthropic = (0, anthropic_1.createAnthropic)({ apiKey: config.apiKey });
        return anthropic(modelId);
    }
    getLimiter(_tier = 'paid') {
        return this.paidLimiter;
    }
}
exports.AnthropicProvider = AnthropicProvider;
exports.anthropicProvider = new AnthropicProvider();
