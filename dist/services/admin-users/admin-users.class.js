"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `admin-users` service — superadmin CRUD for user management.
 *
 * - find(params) → GET /admin-users        — list all users (paginated, searchable)
 * - get(id)      → GET /admin-users/:id    — get single user with roles
 * - patch(id)    → PATCH /admin-users/:id  — update user (status, name, etc.)
 *
 * The actual logic lives in `hooks/findAdminUsers.ts`, `hooks/getAdminUser.ts`, `hooks/patchAdminUser.ts`.
 */
class AdminUsersService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return { data: [], total: 0 }; }
    async get(_id, _params) { return {}; }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { return {}; }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AdminUsersService = AdminUsersService;
