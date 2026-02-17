import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `invitation-accept` service — accept a project invitation (authenticated).
 *
 * - create(data, params) → POST /invitation-accept
 *
 * The actual logic lives in `hooks/acceptInvitation.ts`.
 */
export class InvitationAcceptService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
