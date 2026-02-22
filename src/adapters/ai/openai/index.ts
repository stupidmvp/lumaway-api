import { createOpenAI } from '@ai-sdk/openai';
import Bottleneck from 'bottleneck';
import type { LLMProvider, LLMProviderConfig } from '../llm-provider.interface';

/**
 * OpenAIProvider - OpenAI LLM implementation.
 *
 * No free tier — requires user-provided API key.
 * Available for Pro (with LumaWay key) and Enterprise (with org/project key).
 */
export class OpenAIProvider implements LLMProvider {
    readonly name = 'openai';

    private paidLimiter = new Bottleneck({ maxConcurrent: 10, minTime: 100 });

    async getModel(config?: LLMProviderConfig) {
        if (!config?.apiKey) {
            throw new Error('OpenAI provider requires an API key (not available in free tier)');
        }
        const modelId = config.modelId ?? 'gpt-4o-mini';
        const openai = createOpenAI({ apiKey: config.apiKey });
        return openai(modelId);
    }

    getLimiter(_tier: 'free' | 'paid' = 'paid') {
        return this.paidLimiter;
    }
}

export const openaiProvider = new OpenAIProvider();
