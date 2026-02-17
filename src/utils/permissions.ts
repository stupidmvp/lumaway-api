import { eq, inArray } from 'drizzle-orm';
import { DrizzleAdapter } from '@flex-donec/core';
import { userRoles, rolePermissions, permissions, modules } from '../db/schema';

/**
 * Get all permissions for a user (across all their roles)
 * Returns an array of strings in format: "module_key:permission_name"
 */
export async function getUserPermissions(
    storage: DrizzleAdapter,
    userId: string
): Promise<string[]> {
    const db = (storage as any).db;

    // Get all roles for the user
    const userRoleRecords = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

    if (userRoleRecords.length === 0) {
        return [];
    }

    const roleIds = userRoleRecords.map((r: any) => r.roleId);

    // Get all permissions for those roles
    const rolePermissionRecords = await db
        .select({
            permissionId: rolePermissions.permissionId
        })
        .from(rolePermissions)
        .where(inArray(rolePermissions.roleId, roleIds));

    if (rolePermissionRecords.length === 0) {
        return [];
    }

    const permissionIds = rolePermissionRecords.map((rp: any) => rp.permissionId);

    // Get permission details with module keys
    const permissionDetails = await db
        .select({
            moduleKey: modules.key,
            permissionName: permissions.name
        })
        .from(permissions)
        .innerJoin(modules, eq(permissions.moduleId, modules.id))
        .where(inArray(permissions.id, permissionIds));

    // Format as "module_key:permission_name"
    return permissionDetails.map(
        (p: any) => `${p.moduleKey}:${p.permissionName}`
    );
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
    storage: DrizzleAdapter,
    userId: string,
    moduleKey: string,
    permissionName: string
): Promise<boolean> {
    const userPermissions = await getUserPermissions(storage, userId);
    return userPermissions.includes(`${moduleKey}:${permissionName}`);
}
