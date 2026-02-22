import { createAnthropic } from '@ai-sdk/anthropic';
import Bottleneck from 'bottleneck';
import type { LLMProvider, LLMProviderConfig } from '../llm-provider.interface';

/**
 * AnthropicProvider - Anthropic Claude LLM implementation.
 *
 * No free tier — requires user-provided API key.
 * Available for Enterprise tier with org/project key.
 */
export class AnthropicProvider implements LLMProvider {
    readonly name = 'anthropic';

    private paidLimiter = new Bottleneck({ maxConcurrent: 10, minTime: 100 });

    async getModel(config?: LLMProviderConfig) {
        if (!config?.apiKey) {
            throw new Error('Anthropic provider requires an API key (not available in free tier)');
        }
        const modelId = config.modelId ?? 'claude-sonnet-4-20250514';
        const anthropic = createAnthropic({ apiKey: config.apiKey });
        return anthropic(modelId);
    }

    getLimiter(_tier: 'free' | 'paid' = 'paid') {
        return this.paidLimiter;
    }
}

export const anthropicProvider = new AnthropicProvider();
