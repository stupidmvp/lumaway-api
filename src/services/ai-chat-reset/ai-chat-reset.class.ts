import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `ai-chat-reset` service — POST /ai-chat-reset
 *
 * Clears conversation history for a project.
 * Useful when user wants to start fresh or context becomes stale.
 */
export class AiChatResetService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
