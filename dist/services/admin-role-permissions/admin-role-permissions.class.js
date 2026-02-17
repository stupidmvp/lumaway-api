"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRolePermissionsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `admin-role-permissions` service — manage permissions for a specific role.
 *
 * - get(roleId)          → GET /admin-role-permissions/:id    — list permissions for role
 * - patch(roleId, data)  → PATCH /admin-role-permissions/:id  — replace all permissions
 *   data = { permissionIds: string[] }
 *
 * The actual logic lives in `hooks/getRolePermissions.ts` and `hooks/patchRolePermissions.ts`.
 */
class AdminRolePermissionsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { return {}; }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { return {}; }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AdminRolePermissionsService = AdminRolePermissionsService;
