import { db } from '../../../adapters';
import { projectInvitations, notifications } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Before hook for `create` on `invitation-reject`.
 *
 * Rejects a project invitation (authenticated).
 * The token comes from `params.route.id` or `data.token`.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const rejectInvitation = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    const token = context.params?.route?.id || context.data?.token;
    if (!token) {
        throw new Error('Invitation token is required');
    }

    const [invitation] = await db
        .select()
        .from(projectInvitations)
        .where(eq(projectInvitations.token, token))
        .limit(1);

    if (!invitation) {
        throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
        throw new Error(`Invitation already ${invitation.status}`);
    }

    // Mark as rejected
    await db.update(projectInvitations)
        .set({ status: 'rejected' })
        .where(eq(projectInvitations.id, invitation.id));

    // Mark the invitation notification as read
    await db.update(notifications)
        .set({ read: true })
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.type, 'project_invitation')
            )
        );

    context.result = { message: 'Invitation rejected' };
    return context;
};

