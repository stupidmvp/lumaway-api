import { db } from '../../../adapters';
import { organizationMembers, users } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Before hook for `create` on `user-organization-leave`.
 *
 * Allows a user to leave an organization.
 * Sole owners cannot leave (they must transfer ownership or delete the org).
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const leaveOrganization = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const { organizationId } = context.data;
    if (!organizationId) {
        const error = new Error('organizationId is required');
        error.name = 'ValidationError';
        throw error;
    }

    // Check if user is a member of this org
    const [membership] = await db
        .select()
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.userId, user.id)
            )
        )
        .limit(1);

    if (!membership) {
        const error = new Error('You are not a member of this organization');
        error.name = 'ValidationError';
        throw error;
    }

    // If user is an owner, check if they are the only owner
    if (membership.role === 'owner') {
        const owners = await db
            .select({ id: organizationMembers.id })
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, organizationId),
                    eq(organizationMembers.role, 'owner')
                )
            );

        if (owners.length <= 1) {
            const error = new Error('You are the only owner. Transfer ownership before leaving or delete the organization.');
            error.name = 'ValidationError';
            throw error;
        }
    }

    // Remove user's membership
    await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.id, membership.id));

    // Clear legacy organizationId if it matches
    await db
        .update(users)
        .set({ organizationId: null })
        .where(
            and(
                eq(users.id, user.id),
                eq(users.organizationId, organizationId)
            )
        );

    context.result = { message: 'You have left the organization' };
    return context;
};

