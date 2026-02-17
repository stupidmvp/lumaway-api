import { db } from '../../../adapters';
import { users, roles, userRoles } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `get` on `admin-users`.
 *
 * Gets a single user with their global roles.
 *
 * Sets `context.result` to short-circuit the default service get.
 */
export const getAdminUser = async (context: any) => {
    const id = context.id || context.params?.route?.id;

    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
            status: users.status,
            organizationId: users.organizationId,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!user) {
        throw new Error('User not found');
    }

    // Get user roles
    const userRolesList = await db
        .select({
            roleId: userRoles.roleId,
            roleName: roles.name,
            roleDescription: roles.description,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, id));

    context.result = {
        ...user,
        globalRoles: userRolesList.map((ur: any) => ur.roleName),
        roleDetails: userRolesList,
    };

    return context;
};

