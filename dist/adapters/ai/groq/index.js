"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqProvider = exports.GroqProvider = void 0;
const groq_1 = require("@ai-sdk/groq");
const bottleneck_1 = __importDefault(require("bottleneck"));
const secrets_cache_1 = require("../../../services/system-secrets/secrets.cache");
/**
 * GroqProvider - Groq LLM implementation via native @ai-sdk/groq.
 *
 * Free tier default: llama-3.1-70b-versatile (~30 RPM)
 * Paid tier: any Groq model with user-provided key
 */
class GroqProvider {
    constructor() {
        this.name = 'groq';
        this.freeLimiter = new bottleneck_1.default({ maxConcurrent: 3, minTime: 2000 });
        this.paidLimiter = new bottleneck_1.default({ maxConcurrent: 10, minTime: 200 });
    }
    async getModel(config) {
        const apiKey = config?.apiKey ?? await secrets_cache_1.secretsService.get('GROQ_API_KEY_1');
        const modelId = config?.modelId ?? 'llama-3.1-8b-instant';
        const groq = (0, groq_1.createGroq)({ apiKey });
        return groq(modelId);
    }
    getLimiter(tier = 'free') {
        return tier === 'paid' ? this.paidLimiter : this.freeLimiter;
    }
}
exports.GroqProvider = GroqProvider;
exports.groqProvider = new GroqProvider();
