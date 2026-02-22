import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `ai-chat` service — POST /ai-chat
 *
 * Receives a user message + projectId, resolves the correct LLM
 * based on org subscription, and responds with AI-generated text
 * using walkthrough context from the project.
 *
 * Logic lives in `hooks/handleAiChat.ts`.
 */
export class AiChatService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
