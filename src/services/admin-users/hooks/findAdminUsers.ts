import { db } from '../../../adapters';
import { users, organizations, roles, userRoles } from '../../../db/schema';
import { eq, and, inArray, ilike, or, count } from 'drizzle-orm';

/**
 * Before hook for `find` on `admin-users`.
 *
 * Lists all users (paginated, searchable) for superadmin.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findAdminUsers = async (context: any) => {
    const query = context.params?.query || {};
    const { search, status, $limit, $skip } = query;
    const limit = Math.min(Number($limit) || 25, 100);
    const skip = Number($skip) || 0;

    const userColumns = {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        status: users.status,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
    };

    // Build where conditions
    const conditions: any[] = [];

    if (status && status !== 'all') {
        conditions.push(eq(users.status, status as 'active' | 'inactive' | 'suspended'));
    }

    if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
            or(
                ilike(users.email, searchTerm),
                ilike(users.firstName, searchTerm),
                ilike(users.lastName, searchTerm)
            )
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch users
    const allUsers = whereClause
        ? await db.select(userColumns).from(users).where(whereClause).limit(limit).offset(skip)
        : await db.select(userColumns).from(users).limit(limit).offset(skip);

    // Fetch roles for each user
    const userIds = allUsers.map((u) => u.id);
    const userRolesMap: Record<string, string[]> = {};

    if (userIds.length > 0) {
        const allUserRoles = await db
            .select({
                userId: userRoles.userId,
                roleName: roles.name,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(inArray(userRoles.userId, userIds));

        for (const ur of allUserRoles) {
            if (!userRolesMap[ur.userId]) userRolesMap[ur.userId] = [];
            userRolesMap[ur.userId].push(ur.roleName);
        }
    }

    // Fetch org names for users
    const orgMap: Record<string, string> = {};
    const orgIds = [...new Set(allUsers.map((u) => u.organizationId).filter(Boolean))] as string[];
    if (orgIds.length > 0) {
        const orgs = await db
            .select({ id: organizations.id, name: organizations.name })
            .from(organizations)
            .where(inArray(organizations.id, orgIds));
        for (const org of orgs) {
            orgMap[org.id] = org.name;
        }
    }

    // Count total
    const totalResult = whereClause
        ? await db.select({ count: count(users.id) }).from(users).where(whereClause)
        : await db.select({ count: count(users.id) }).from(users);

    const total = Number(totalResult[0]?.count ?? 0);

    context.result = {
        data: allUsers.map((u) => ({
            ...u,
            globalRoles: userRolesMap[u.id] || [],
            organizationName: orgMap[u.organizationId!] || null,
        })),
        total,
        limit,
        skip,
    };

    return context;
};
