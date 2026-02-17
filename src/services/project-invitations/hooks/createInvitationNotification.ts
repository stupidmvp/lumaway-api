import { db } from '../../../adapters';
import { notifications, users, projects } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * After create: if the invitee already has an account, create a notification for them.
 */
export const createInvitationNotification = async (context: any) => {
    const invitation = context.result;
    if (!invitation) return context;

    try {
        // Check if user exists
        const [invitee] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, invitation.email.toLowerCase()))
            .limit(1);

        if (!invitee) return context; // No account yet, they'll see it when they register

        // Get project name for notification
        const [project] = await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, invitation.projectId))
            .limit(1);

        // Get inviter name
        const [inviter] = await db
            .select({ firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, invitation.invitedBy))
            .limit(1);

        const inviterName = inviter
            ? [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || 'Someone'
            : 'Someone';

        await db.insert(notifications).values({
            userId: invitee.id,
            type: 'project_invitation',
            title: `Invitation to "${project?.name || 'a project'}"`,
            body: `${inviterName} invited you to join as ${invitation.role}`,
            metadata: {
                projectId: invitation.projectId,
                invitationId: invitation.id,
                invitationToken: invitation.token,
                role: invitation.role,
            },
        });
    } catch (error) {
        console.error('Error creating invitation notification:', error);
    }

    return context;
};


