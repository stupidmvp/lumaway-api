import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `admin-role-permissions` service — manage permissions for a specific role.
 *
 * - get(roleId)          → GET /admin-role-permissions/:id    — list permissions for role
 * - patch(roleId, data)  → PATCH /admin-role-permissions/:id  — replace all permissions
 *   data = { permissionIds: string[] }
 *
 * The actual logic lives in `hooks/getRolePermissions.ts` and `hooks/patchRolePermissions.ts`.
 */
export class AdminRolePermissionsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { return {}; }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { return {}; }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
