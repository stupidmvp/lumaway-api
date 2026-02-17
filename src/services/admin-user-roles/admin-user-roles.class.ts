import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `admin-user-roles` service — update global roles for a specific user.
 *
 * - patch(userId, data) → PATCH /admin-user-roles/:id
 *   data = { roleIds: string[] }
 *
 * The actual logic lives in `hooks/patchUserRoles.ts`.
 */
export class AdminUserRolesService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { return {}; }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
