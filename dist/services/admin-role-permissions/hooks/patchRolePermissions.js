"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchRolePermissions = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `admin-role-permissions`.
 *
 * Replaces all permissions for a specific role.
 * data = { permissionIds: string[] }
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchRolePermissions = async (context) => {
    const roleId = context.id || context.params?.route?.id;
    const { permissionIds } = context.data;
    if (!Array.isArray(permissionIds)) {
        throw new Error('permissionIds must be an array');
    }
    // Delete existing and insert new
    await adapters_1.db.delete(schema_1.rolePermissions).where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
        await adapters_1.db.insert(schema_1.rolePermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
    context.result = { roleId, permissionIds };
    return context;
};
exports.patchRolePermissions = patchRolePermissions;
