import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `admin-roles` service — superadmin CRUD for global roles.
 *
 * - find()        → GET /admin-roles         — list all roles with user/perm counts
 * - create(data)  → POST /admin-roles        — create new role
 * - patch(id)     → PATCH /admin-roles/:id   — update role name/description
 * - remove(id)    → DELETE /admin-roles/:id  — soft-delete role + cleanup associations
 *
 * The actual logic lives in `hooks/findRoles.ts`, `hooks/createRole.ts`,
 * `hooks/patchRole.ts`, `hooks/removeRole.ts`.
 */
export class AdminRolesService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return { data: [], total: 0 }; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { return {}; }
    async remove(_id: string, _params?: any): Promise<any> { return {}; }
}
