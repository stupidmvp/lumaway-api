import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `client-walkthroughs` service — public API-key-authenticated endpoint for fetching
 * published walkthroughs for a project.
 *
 * - find(params) → GET /client-walkthroughs (requires x-api-key header)
 *
 * The actual logic lives in `hooks/findPublishedWalkthroughs.ts`.
 */
export class ClientWalkthroughsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return []; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
