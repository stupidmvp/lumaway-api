import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `user-organizations` service — create and delete organizations.
 *
 * - create(data)  → POST /user-organizations       → creates a new org + owner membership
 * - remove(id)    → DELETE /user-organizations/:id  → deletes an org (owner or superadmin)
 *
 * The actual logic lives in `hooks/createOrganization.ts` and `hooks/removeOrganization.ts`.
 */
export class UserOrganizationsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organizations service');
    }

    async get(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organizations service');
    }

    async create(_data: any, _params?: any): Promise<any> {
        return {};
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organizations service');
    }

    async remove(_id: string, _params?: any): Promise<any> {
        return {};
    }
}
