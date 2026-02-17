import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `me-organizations` service — lists all organizations the current user belongs to.
 *
 * - find(params) → GET /me-organizations → returns the user's organization memberships
 *
 * Superadmin users see ALL organizations in the system.
 *
 * The actual find logic lives in `hooks/findUserOrganizations.ts` (before.find hook).
 */
export class MeOrganizationsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        return { data: [], total: 0 };
    }

    async get(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organizations service');
    }

    async create(_data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organizations service');
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organizations service');
    }

    async remove(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organizations service');
    }
}
