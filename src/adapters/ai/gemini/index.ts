import { createGoogleGenerativeAI } from '@ai-sdk/google';
import Bottleneck from 'bottleneck';
import { secretsService } from '../../../services/system-secrets/secrets.cache';
import type { LLMProvider, LLMProviderConfig } from '../llm-provider.interface';

/**
 * GeminiProvider - Google Gemini LLM implementation.
 *
 * Free tier default: gemini-1.5-flash (~60 RPM)
 * Paid tier: any Gemini model with user-provided key
 */
export class GeminiProvider implements LLMProvider {
    readonly name = 'gemini';

    private freeLimiter = new Bottleneck({ maxConcurrent: 5, minTime: 1000 });
    private paidLimiter = new Bottleneck({ maxConcurrent: 15, minTime: 200 });

    async getModel(config?: LLMProviderConfig) {
        const apiKey = config?.apiKey ?? await secretsService.get('GEMINI_API_KEY_1');
        const modelId = config?.modelId ?? 'gemini-pro';
        const google = createGoogleGenerativeAI({ apiKey });
        return google(modelId);
    }

    getLimiter(tier: 'free' | 'paid' = 'free') {
        return tier === 'paid' ? this.paidLimiter : this.freeLimiter;
    }
}

export const geminiProvider = new GeminiProvider();
