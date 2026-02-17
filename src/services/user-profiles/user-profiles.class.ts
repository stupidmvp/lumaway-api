import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `user-profiles` service — get a user's public profile by ID.
 *
 * - get(id) → GET /user-profiles/:id
 *
 * Returns basic public-facing info (name, avatar, email, org, role).
 * Requires authentication. The actual logic lives in `hooks/getUserProfile.ts`.
 */
export class UserProfilesService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { return {}; }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}

