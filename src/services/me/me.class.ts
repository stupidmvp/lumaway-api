import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `me` service — manages the current authenticated user's profile.
 *
 * - find()      → GET /me        → returns current user profile with memberships
 * - patch(id)   → PATCH /me/:id  → updates user profile (id is ignored, uses auth user)
 *
 * The actual logic lives in `hooks/findCurrentUser.ts` and `hooks/patchCurrentUser.ts`.
 */
export class MeService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        return { data: [], total: 0 };
    }

    async get(_id: string, _params?: any): Promise<any> {
        return this.find(_params);
    }

    async create(_data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me service');
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        return {};
    }

    async remove(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me service');
    }
}
