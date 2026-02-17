import { db } from '../../../adapters';
import { projectInvitations, projectMembers } from '../../../db/schema';
import { eq, and, ne } from 'drizzle-orm';

/**
 * Before create: checks if there's already a pending invitation or an existing member
 * for this email + project combo. Also cleans up old non-pending invitations to avoid
 * unique constraint violations on (projectId, email).
 */
export const checkDuplicateInvitation = async (context: any) => {
    const { projectId, email } = context.data || {};
    if (!projectId || !email) return context;

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing pending invitation
    const [existingPending] = await db
        .select()
        .from(projectInvitations)
        .where(
            and(
                eq(projectInvitations.projectId, projectId),
                eq(projectInvitations.email, normalizedEmail),
                eq(projectInvitations.status, 'pending')
            )
        )
        .limit(1);

    if (existingPending) {
        throw new Error('An invitation for this email is already pending for this project');
    }

    // Check if user is already a member (by looking up the user by email first)
    const { users } = await import('../../../db/schema');
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

    if (user) {
        const [existingMember] = await db
            .select()
            .from(projectMembers)
            .where(
                and(
                    eq(projectMembers.projectId, projectId),
                    eq(projectMembers.userId, user.id)
                )
            )
            .limit(1);

        if (existingMember) {
            throw new Error('This user is already a member of this project');
        }
    }

    // Clean up old non-pending invitations for this email+project to avoid
    // unique constraint violation on (projectId, email)
    await db
        .delete(projectInvitations)
        .where(
            and(
                eq(projectInvitations.projectId, projectId),
                eq(projectInvitations.email, normalizedEmail),
                ne(projectInvitations.status, 'pending')
            )
        );

    return context;
};

