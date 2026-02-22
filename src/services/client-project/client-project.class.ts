import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `client-project` service — public API-key-authenticated endpoint for fetching
 * project configuration (branding, assistant settings).
 *
 * - find(params) → GET /client-project (requires x-api-key header)
 */
export class ClientProjectService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return {}; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
