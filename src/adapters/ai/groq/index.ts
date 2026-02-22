import { createGroq } from '@ai-sdk/groq';
import Bottleneck from 'bottleneck';
import { secretsService } from '../../../services/system-secrets/secrets.cache';
import type { LLMProvider, LLMProviderConfig } from '../llm-provider.interface';

/**
 * GroqProvider - Groq LLM implementation via native @ai-sdk/groq.
 *
 * Free tier default: llama-3.1-70b-versatile (~30 RPM)
 * Paid tier: any Groq model with user-provided key
 */
export class GroqProvider implements LLMProvider {
    readonly name = 'groq';

    private freeLimiter = new Bottleneck({ maxConcurrent: 3, minTime: 2000 });
    private paidLimiter = new Bottleneck({ maxConcurrent: 10, minTime: 200 });

    async getModel(config?: LLMProviderConfig) {
        const apiKey = config?.apiKey ?? await secretsService.get('GROQ_API_KEY_1');
        const modelId = config?.modelId ?? 'llama-3.1-8b-instant';
        const groq = createGroq({ apiKey });
        return groq(modelId);
    }

    getLimiter(tier: 'free' | 'paid' = 'free') {
        return tier === 'paid' ? this.paidLimiter : this.freeLimiter;
    }
}

export const groqProvider = new GroqProvider();
