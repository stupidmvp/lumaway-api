/**
 * AI Adapter - Public API
 *
 * Central export for all AI-related functionality:
 * - LLMService: Direct LLM calls (with rate limiting)
 * - resolveLLM: Multi-tenant credential resolution
 * - Providers: Gemini, Groq, OpenAI, Anthropic
 */

export { LLMService, geminiLLM, groqLLM, type LLMProviderName } from './llm.service';
export type { LLMProvider, LLMProviderConfig } from './llm-provider.interface';
export { resolveLLM } from './llm-resolver';
export { geminiProvider } from './gemini';
export { groqProvider } from './groq';
export { openaiProvider } from './openai';
export { anthropicProvider } from './anthropic';
