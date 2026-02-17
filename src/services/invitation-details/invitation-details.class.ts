import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `invitation-details` service — get invitation details by token (public endpoint).
 *
 * - get(token) → GET /invitation-details/:token
 *
 * The actual logic lives in `hooks/getInvitationDetails.ts`.
 */
export class InvitationDetailsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { return {}; }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
