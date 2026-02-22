import type { LanguageModel } from 'ai';
import type Bottleneck from 'bottleneck';

/**
 * Dynamic configuration for LLM providers.
 * When provided, overrides the default system-level credentials/model.
 */
export interface LLMProviderConfig {
    /** If provided, use this API key instead of the system secret */
    apiKey?: string;
    /** If provided, use this model instead of the provider's default */
    modelId?: string;
}

/**
 * LLMProvider - Contract for LLM provider implementations.
 *
 * Each provider (Gemini, Groq, OpenAI, Anthropic) must implement this interface,
 * encapsulating model instantiation, API key management, and rate limiting.
 */
export interface LLMProvider {
    /** Unique provider name (e.g. 'gemini', 'groq', 'openai', 'anthropic') */
    readonly name: string;

    /** Return a Vercel AI SDK LanguageModel instance. Config overrides defaults. */
    getModel(config?: LLMProviderConfig): Promise<LanguageModel>;

    /** Return the rate limiter for the given tier */
    getLimiter(tier?: 'free' | 'paid'): Bottleneck;
}
