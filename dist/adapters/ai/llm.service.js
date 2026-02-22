"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqLLM = exports.geminiLLM = exports.LLMService = void 0;
const ai_1 = require("ai");
const gemini_1 = require("./gemini");
const groq_1 = require("./groq");
const openai_1 = require("./openai");
const anthropic_1 = require("./anthropic");
/** Registry of available providers */
const providers = {
    gemini: gemini_1.geminiProvider,
    groq: groq_1.groqProvider,
    openai: openai_1.openaiProvider,
    anthropic: anthropic_1.anthropicProvider,
};
/**
 * LLMService - Unified interface for LLM interactions.
 *
 * Uses Vercel AI SDK with provider injection.
 * Supports dynamic config (apiKey, modelId) for multi-tenant resolution.
 */
class LLMService {
    constructor(provider, config, tier = 'free') {
        this.provider = provider;
        this.config = config;
        this.tier = tier;
    }
    /**
     * Generate free-form text from a prompt.
     */
    async text(prompt, options = {}) {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);
        const result = await limiter.schedule(() => (0, ai_1.generateText)({
            model,
            prompt,
            ...(options.system ? { system: options.system } : {}),
        }));
        return result.text;
    }
    /**
     * Stream text generation token-by-token (or chunk-by-chunk).
     * Calls `onPartial` with accumulated text and latest delta.
     */
    async textStream(prompt, options = {}, onPartial) {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);
        return await limiter.schedule(async () => {
            const result = (0, ai_1.streamText)({
                model,
                prompt,
                ...(options.system ? { system: options.system } : {}),
            });
            let full = '';
            for await (const delta of result.textStream) {
                if (!delta)
                    continue;
                full += delta;
                onPartial?.(full, delta);
            }
            return full;
        });
    }
    /**
     * Generate a structured JSON object validated against a Zod schema.
     *
     * Note: Uses `any` cast on schema to avoid TS2589 deep type recursion
     * with Vercel AI SDK's generateObject + complex Zod schemas.
     */
    async structured(prompt, schema, options = {}) {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);
        const result = await limiter.schedule(() => (0, ai_1.generateObject)({
            model,
            schema: schema,
            prompt,
            ...(options.system ? { system: options.system } : {}),
        }));
        return result.object;
    }
    /**
     * Get a provider by name from the registry.
     */
    static getProvider(name) {
        const provider = providers[name];
        if (!provider) {
            throw new Error(`Unknown LLM provider: ${name}`);
        }
        return provider;
    }
    /**
     * Create an LLMService for a specific provider by name.
     * Optionally pass config for dynamic key/model resolution.
     */
    static for(name, config, tier = 'free') {
        return new LLMService(LLMService.getProvider(name), config, tier);
    }
}
exports.LLMService = LLMService;
// Pre-configured free-tier instances (backward compatible)
exports.geminiLLM = new LLMService(gemini_1.geminiProvider);
exports.groqLLM = new LLMService(groq_1.groqProvider);
