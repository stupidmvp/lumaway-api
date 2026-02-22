"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProvider = exports.GeminiProvider = void 0;
const google_1 = require("@ai-sdk/google");
const bottleneck_1 = __importDefault(require("bottleneck"));
const secrets_cache_1 = require("../../../services/system-secrets/secrets.cache");
/**
 * GeminiProvider - Google Gemini LLM implementation.
 *
 * Free tier default: gemini-1.5-flash (~60 RPM)
 * Paid tier: any Gemini model with user-provided key
 */
class GeminiProvider {
    constructor() {
        this.name = 'gemini';
        this.freeLimiter = new bottleneck_1.default({ maxConcurrent: 5, minTime: 1000 });
        this.paidLimiter = new bottleneck_1.default({ maxConcurrent: 15, minTime: 200 });
    }
    async getModel(config) {
        const apiKey = config?.apiKey ?? await secrets_cache_1.secretsService.get('GEMINI_API_KEY_1');
        const modelId = config?.modelId ?? 'gemini-pro';
        const google = (0, google_1.createGoogleGenerativeAI)({ apiKey });
        return google(modelId);
    }
    getLimiter(tier = 'free') {
        return tier === 'paid' ? this.paidLimiter : this.freeLimiter;
    }
}
exports.GeminiProvider = GeminiProvider;
exports.geminiProvider = new GeminiProvider();
