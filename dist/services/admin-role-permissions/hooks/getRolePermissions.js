"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolePermissions = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `get` on `admin-role-permissions`.
 *
 * Lists permissions for a specific role.
 *
 * Sets `context.result` to short-circuit the default service get.
 */
const getRolePermissions = async (context) => {
    const roleId = context.id || context.params?.route?.id;
    const rolePerms = await adapters_1.db
        .select({
        permissionId: schema_1.rolePermissions.permissionId,
        permissionName: schema_1.permissions.name,
        permissionDescription: schema_1.permissions.description,
        moduleId: schema_1.permissions.moduleId,
        moduleName: schema_1.modules.name,
        moduleKey: schema_1.modules.key,
    })
        .from(schema_1.rolePermissions)
        .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
        .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.permissions.moduleId, schema_1.modules.id))
        .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
    context.result = { roleId, permissions: rolePerms };
    return context;
};
exports.getRolePermissions = getRolePermissions;
