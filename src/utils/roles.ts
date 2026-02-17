import { eq } from 'drizzle-orm';
import { DrizzleAdapter } from '@flex-donec/core';
import { userRoles, roles } from '../db/schema';

/**
 * Get all roles for a user
 * Returns an array of role names
 */
export async function getUserRoles(
    storage: DrizzleAdapter,
    userId: string
): Promise<string[]> {
    const db = (storage as any).db;

    const userRoleRecords = await db
        .select({
            roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

    return userRoleRecords.map((r: any) => r.roleName);
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(
    storage: DrizzleAdapter,
    userId: string,
    roleName: string
): Promise<boolean> {
    const roles = await getUserRoles(storage, userId);
    return roles.includes(roleName);
}
