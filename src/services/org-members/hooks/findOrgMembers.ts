import { drizzleAdapter, db } from '../../../adapters';
import { organizationMembers, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgRole } from '../../../utils/organizationMemberships';

/**
 * Before hook for `find` on `org-members`.
 *
 * Lists members of an organization.
 * Must be owner/admin of the org, or superadmin.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findOrgMembers = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const orgId = context.params?.orgId || context.params?.query?.orgId;
    if (!orgId) {
        const error = new Error('orgId query parameter is required');
        error.name = 'ValidationError';
        throw error;
    }

    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');

    // Superadmin bypasses org membership check
    if (!isSuperAdmin) {
        const userRole = await getUserOrgRole(drizzleAdapter, user.id, orgId);
        if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
            throw new Error('Authorization: You do not have permission to view organization members');
        }
    }

    const members = await db
        .select({
            id: organizationMembers.id,
            userId: organizationMembers.userId,
            role: organizationMembers.role,
            createdAt: organizationMembers.createdAt,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            avatar: users.avatar,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, orgId));

    context.result = {
        data: members,
        total: members.length,
    };

    return context;
};

