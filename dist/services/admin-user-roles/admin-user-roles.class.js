"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserRolesService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `admin-user-roles` service — update global roles for a specific user.
 *
 * - patch(userId, data) → PATCH /admin-user-roles/:id
 *   data = { roleIds: string[] }
 *
 * The actual logic lives in `hooks/patchUserRoles.ts`.
 */
class AdminUserRolesService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { return {}; }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AdminUserRolesService = AdminUserRolesService;
