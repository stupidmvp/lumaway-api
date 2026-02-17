import { drizzleAdapter, db } from '../../../adapters';
import { organizationMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgRole } from '../../../utils/organizationMemberships';

/**
 * Before hook for `patch` on `org-members`.
 *
 * Updates a member's role. Only owners or superadmins can change roles.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchOrgMember = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const memberId = context.id || context.params?.route?.id;
    const { role } = context.data;

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
        const error = new Error('Invalid role. Must be owner, admin, or member');
        error.name = 'ValidationError';
        throw error;
    }

    // Get the membership being updated
    const [membership] = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.id, memberId))
        .limit(1);

    if (!membership) {
        const error = new Error('Membership not found');
        error.name = 'NotFoundError';
        throw error;
    }

    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');

    if (!isSuperAdmin) {
        const userRole = await getUserOrgRole(drizzleAdapter, user.id, membership.organizationId);
        if (userRole !== 'owner') {
            throw new Error('Authorization: Only organization owners can change member roles');
        }
    }

    // Prevent demoting yourself
    if (membership.userId === user.id && role !== 'owner' && !isSuperAdmin) {
        const error = new Error('You cannot demote yourself');
        error.name = 'ValidationError';
        throw error;
    }

    const [updated] = await db
        .update(organizationMembers)
        .set({ role })
        .where(eq(organizationMembers.id, memberId))
        .returning();

    context.result = updated;
    return context;
};

