"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionsService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const role_permissions_schema_1 = require("./role-permissions.schema");
class RolePermissionsService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.rolePermissions, role_permissions_schema_1.rolePermissionsCreateSchema, role_permissions_schema_1.rolePermissionsPatchSchema);
    }
}
exports.RolePermissionsService = RolePermissionsService;
