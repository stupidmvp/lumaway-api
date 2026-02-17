import { db } from '../../../adapters';
import { rolePermissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `patch` on `admin-role-permissions`.
 *
 * Replaces all permissions for a specific role.
 * data = { permissionIds: string[] }
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchRolePermissions = async (context: any) => {
    const roleId = context.id || context.params?.route?.id;
    const { permissionIds } = context.data;

    if (!Array.isArray(permissionIds)) {
        throw new Error('permissionIds must be an array');
    }

    // Delete existing and insert new
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
            permissionIds.map((permissionId: string) => ({ roleId, permissionId }))
        );
    }

    context.result = { roleId, permissionIds };
    return context;
};

