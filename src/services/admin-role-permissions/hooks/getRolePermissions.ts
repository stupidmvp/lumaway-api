import { db } from '../../../adapters';
import { rolePermissions, permissions, modules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `get` on `admin-role-permissions`.
 *
 * Lists permissions for a specific role.
 *
 * Sets `context.result` to short-circuit the default service get.
 */
export const getRolePermissions = async (context: any) => {
    const roleId = context.id || context.params?.route?.id;

    const rolePerms = await db
        .select({
            permissionId: rolePermissions.permissionId,
            permissionName: permissions.name,
            permissionDescription: permissions.description,
            moduleId: permissions.moduleId,
            moduleName: modules.name,
            moduleKey: modules.key,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .innerJoin(modules, eq(permissions.moduleId, modules.id))
        .where(eq(rolePermissions.roleId, roleId));

    context.result = { roleId, permissions: rolePerms };
    return context;
};

