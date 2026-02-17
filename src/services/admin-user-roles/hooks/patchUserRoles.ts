import { db } from '../../../adapters';
import { users, roles, userRoles } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `patch` on `admin-user-roles`.
 *
 * Replaces all global roles for a specific user.
 * data = { roleIds: string[] }
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchUserRoles = async (context: any) => {
    const id = context.id || context.params?.route?.id;
    const { roleIds } = context.data;

    if (!Array.isArray(roleIds)) {
        throw new Error('roleIds must be an array');
    }

    // Verify user exists
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
        throw new Error('User not found');
    }

    // Delete existing roles and insert new ones
    await db.delete(userRoles).where(eq(userRoles.userId, id));

    if (roleIds.length > 0) {
        await db.insert(userRoles).values(
            roleIds.map((roleId: string) => ({ userId: id, roleId }))
        );
    }

    // Return updated roles
    const updatedRoles = await db
        .select({ roleId: userRoles.roleId, roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, id));

    context.result = { userId: id, roles: updatedRoles };
    return context;
};

