import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `me-organization` service — manages the active organization for the current user.
 *
 * - find(params)       → GET /me-organization        → returns the active org
 * - patch(id, data)    → PATCH /me-organization/:id  → updates the active org
 *
 * The actual logic lives in `hooks/findActiveOrganization.ts` and `hooks/patchActiveOrganization.ts`.
 */
export class MeOrganizationService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        return null;
    }

    async get(_id: string, _params?: any): Promise<any> {
        return this.find(_params);
    }

    async create(_data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organization service');
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        return {};
    }

    async remove(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on me-organization service');
    }
}
