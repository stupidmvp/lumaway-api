"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = getUserPermissions;
exports.userHasPermission = userHasPermission;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
/**
 * Get all permissions for a user (across all their roles)
 * Returns an array of strings in format: "module_key:permission_name"
 */
async function getUserPermissions(storage, userId) {
    const db = storage.db;
    // Get all roles for the user
    const userRoleRecords = await db
        .select({ roleId: schema_1.userRoles.roleId })
        .from(schema_1.userRoles)
        .where((0, drizzle_orm_1.eq)(schema_1.userRoles.userId, userId));
    if (userRoleRecords.length === 0) {
        return [];
    }
    const roleIds = userRoleRecords.map((r) => r.roleId);
    // Get all permissions for those roles
    const rolePermissionRecords = await db
        .select({
        permissionId: schema_1.rolePermissions.permissionId
    })
        .from(schema_1.rolePermissions)
        .where((0, drizzle_orm_1.inArray)(schema_1.rolePermissions.roleId, roleIds));
    if (rolePermissionRecords.length === 0) {
        return [];
    }
    const permissionIds = rolePermissionRecords.map((rp) => rp.permissionId);
    // Get permission details with module keys
    const permissionDetails = await db
        .select({
        moduleKey: schema_1.modules.key,
        permissionName: schema_1.permissions.name
    })
        .from(schema_1.permissions)
        .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.permissions.moduleId, schema_1.modules.id))
        .where((0, drizzle_orm_1.inArray)(schema_1.permissions.id, permissionIds));
    // Format as "module_key:permission_name"
    return permissionDetails.map((p) => `${p.moduleKey}:${p.permissionName}`);
}
/**
 * Check if user has a specific permission
 */
async function userHasPermission(storage, userId, moduleKey, permissionName) {
    const userPermissions = await getUserPermissions(storage, userId);
    return userPermissions.includes(`${moduleKey}:${permissionName}`);
}
