import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `admin-users` service — superadmin CRUD for user management.
 *
 * - find(params) → GET /admin-users        — list all users (paginated, searchable)
 * - get(id)      → GET /admin-users/:id    — get single user with roles
 * - patch(id)    → PATCH /admin-users/:id  — update user (status, name, etc.)
 *
 * The actual logic lives in `hooks/findAdminUsers.ts`, `hooks/getAdminUser.ts`, `hooks/patchAdminUser.ts`.
 */
export class AdminUsersService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return { data: [], total: 0 }; }
    async get(_id: string, _params?: any): Promise<any> { return {}; }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { return {}; }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
