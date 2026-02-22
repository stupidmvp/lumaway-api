import { generateText, generateObject, streamText } from 'ai';
import { z } from 'zod';
import type { LLMProvider, LLMProviderConfig } from './llm-provider.interface';
import { geminiProvider } from './gemini';
import { groqProvider } from './groq';
import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';

/** Registered provider names */
export type LLMProviderName = 'gemini' | 'groq' | 'openai' | 'anthropic';

/** Registry of available providers */
const providers: Record<LLMProviderName, LLMProvider> = {
    gemini: geminiProvider,
    groq: groqProvider,
    openai: openaiProvider,
    anthropic: anthropicProvider,
};

/**
 * LLMService - Unified interface for LLM interactions.
 *
 * Uses Vercel AI SDK with provider injection.
 * Supports dynamic config (apiKey, modelId) for multi-tenant resolution.
 */
export class LLMService {
    constructor(
        private provider: LLMProvider,
        private config?: LLMProviderConfig,
        private tier: 'free' | 'paid' = 'free',
    ) { }

    /**
     * Generate free-form text from a prompt.
     */
    async text(prompt: string, options: { system?: string } = {}): Promise<string> {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);

        const result = await limiter.schedule(() =>
            generateText({
                model,
                prompt,
                ...(options.system ? { system: options.system } : {}),
            })
        );

        return result.text;
    }

    /**
     * Stream text generation token-by-token (or chunk-by-chunk).
     * Calls `onPartial` with accumulated text and latest delta.
     */
    async textStream(
        prompt: string,
        options: { system?: string } = {},
        onPartial?: (partial: string, delta: string) => void,
    ): Promise<string> {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);

        return await limiter.schedule(async () => {
            const result = streamText({
                model,
                prompt,
                ...(options.system ? { system: options.system } : {}),
            });

            let full = '';
            for await (const delta of result.textStream) {
                if (!delta) continue;
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
    async structured<T>(
        prompt: string,
        schema: z.ZodType<T>,
        options: { system?: string } = {}
    ): Promise<T> {
        const model = await this.provider.getModel(this.config);
        const limiter = this.provider.getLimiter(this.tier);

        const result = await limiter.schedule(() =>
            generateObject({
                model,
                schema: schema as any,
                prompt,
                ...(options.system ? { system: options.system } : {}),
            })
        );

        return result.object as T;
    }

    /**
     * Get a provider by name from the registry.
     */
    static getProvider(name: LLMProviderName): LLMProvider {
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
    static for(name: LLMProviderName, config?: LLMProviderConfig, tier: 'free' | 'paid' = 'free'): LLMService {
        return new LLMService(LLMService.getProvider(name), config, tier);
    }
}

// Pre-configured free-tier instances (backward compatible)
export const geminiLLM = new LLMService(geminiProvider);
export const groqLLM = new LLMService(groqProvider);
