"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRolesService = void 0;
const core_1 = require("@flex-donec/core");
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
class AdminRolesService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return { data: [], total: 0 }; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { return {}; }
    async remove(_id, _params) { return {}; }
}
exports.AdminRolesService = AdminRolesService;
