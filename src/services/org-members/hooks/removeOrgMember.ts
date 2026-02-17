import { drizzleAdapter, db } from '../../../adapters';
import { organizationMembers, users } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgRole } from '../../../utils/organizationMemberships';

/**
 * Before hook for `remove` on `org-members`.
 *
 * Removes a member from an organization.
 * Only owners or superadmins can remove members.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
export const removeOrgMember = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const memberId = context.id || context.params?.route?.id;

    // Get the membership being removed
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
            throw new Error('Authorization: Only organization owners can remove members');
        }
    }

    // Prevent removing yourself
    if (membership.userId === user.id) {
        const error = new Error('You cannot remove yourself from the organization');
        error.name = 'ValidationError';
        throw error;
    }

    await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.id, memberId));

    // Clear the user's legacy organizationId if it matches
    await db
        .update(users)
        .set({ organizationId: null })
        .where(
            and(
                eq(users.id, membership.userId),
                eq(users.organizationId, membership.organizationId)
            )
        );

    context.result = { message: 'Member removed from organization' };
    return context;
};

