import { db } from '../../../adapters';
import { projectInvitations, projects, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `get` on `invitation-details`.
 *
 * Gets invitation details by token (public endpoint).
 *
 * Sets `context.result` to short-circuit the default service get.
 */
export const getInvitationDetails = async (context: any) => {
    const token = context.id || context.params?.route?.id;

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

    if (new Date(invitation.expiresAt) < new Date()) {
        // Auto-mark as expired
        await db.update(projectInvitations)
            .set({ status: 'expired' })
            .where(eq(projectInvitations.id, invitation.id));
        throw new Error('Invitation has expired');
    }

    // Get project and inviter info for display
    const [project] = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(eq(projects.id, invitation.projectId))
        .limit(1);

    const [inviter] = await db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, invitation.invitedBy))
        .limit(1);

    context.result = {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        project: project || null,
        inviter: inviter || null,
        expiresAt: invitation.expiresAt,
    };

    return context;
};

