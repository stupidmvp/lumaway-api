import { db } from '../../../adapters';
import { roles, userRoles, rolePermissions } from '../../../db/schema';
import { isNull } from 'drizzle-orm';

/**
 * Before hook for `find` on `admin-roles`.
 *
 * Lists all roles with user/permission counts.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findRoles = async (context: any) => {
    const { count: countFn } = await import('drizzle-orm');

    const allRoles = await db
        .select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
            createdAt: roles.createdAt,
        })
        .from(roles)
        .where(isNull(roles.deletedAt))
        .orderBy(roles.name);

    // Count users per role
    const userCounts = await db
        .select({
            roleId: userRoles.roleId,
            count: countFn(userRoles.userId),
        })
        .from(userRoles)
        .groupBy(userRoles.roleId);

    const countMap: Record<string, number> = {};
    for (const uc of userCounts) {
        countMap[uc.roleId] = Number(uc.count);
    }

    // Count permissions per role
    const permCounts = await db
        .select({
            roleId: rolePermissions.roleId,
            count: countFn(rolePermissions.permissionId),
        })
        .from(rolePermissions)
        .groupBy(rolePermissions.roleId);

    const permCountMap: Record<string, number> = {};
    for (const pc of permCounts) {
        permCountMap[pc.roleId] = Number(pc.count);
    }

    context.result = {
        data: allRoles.map((r: any) => ({
            ...r,
            usersCount: countMap[r.id] || 0,
            permissionsCount: permCountMap[r.id] || 0,
        })),
        total: allRoles.length,
    };

    return context;
};

