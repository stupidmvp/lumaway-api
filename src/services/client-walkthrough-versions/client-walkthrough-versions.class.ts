import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `client-walkthrough-versions` service — public API-key-authenticated endpoint 
 * for fetching version history for a specific walkthrough.
 *
 * - find(params) → GET /client-walkthrough-versions?walkthroughId=... (requires x-api-key)
 */
export class ClientWalkthroughVersionsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return []; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
