import { db } from '../../../adapters';
import { roles, userRoles, rolePermissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `remove` on `admin-roles`.
 *
 * Soft-deletes a role and cleans up associations.
 * Cannot delete the superadmin role.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
export const removeRole = async (context: any) => {
    const id = context.id || context.params?.route?.id;

    // Prevent deleting the superadmin role
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!role) {
        throw new Error('Role not found');
    }
    if (role.name === 'superadmin') {
        throw new Error('Cannot delete the superadmin role');
    }

    // Soft delete
    await db
        .update(roles)
        .set({ deletedAt: new Date() })
        .where(eq(roles.id, id));

    // Clean up user-role and role-permission associations
    await db.delete(userRoles).where(eq(userRoles.roleId, id));
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

    context.result = { message: 'Role deleted' };
    return context;
};

