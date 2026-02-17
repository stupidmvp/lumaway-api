"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPermissionsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `admin-permissions` service — list all permissions grouped by module.
 *
 * - find() → GET /admin-permissions
 *
 * The actual logic lives in `hooks/findPermissions.ts`.
 */
class AdminPermissionsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return { data: [] }; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AdminPermissionsService = AdminPermissionsService;
