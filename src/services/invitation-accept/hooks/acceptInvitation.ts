import { drizzleAdapter, db } from '../../../adapters';
import { projectInvitations, projects, projectMembers, users, notifications, organizationMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ensureOrgMembership } from '../../../utils/organizationMemberships';

/**
 * Before hook for `create` on `invitation-accept`.
 *
 * Accepts a project invitation (authenticated).
 * The token comes from `params.route.id` or `data.token`.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const acceptInvitation = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    // Token can come from route param or body
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

    if (new Date(invitation.expiresAt) < new Date()) {
        await db.update(projectInvitations)
            .set({ status: 'expired' })
            .where(eq(projectInvitations.id, invitation.id));
        throw new Error('Invitation has expired');
    }

    // Verify that the authenticated user's email matches the invitation
    const [authUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!authUser || authUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address');
    }

    // Check if already a member
    const [existingMember] = await db
        .select()
        .from(projectMembers)
        .where(
            and(
                eq(projectMembers.projectId, invitation.projectId),
                eq(projectMembers.userId, userId)
            )
        )
        .limit(1);

    if (existingMember) {
        // Already a member — just mark invitation as accepted
        await db.update(projectInvitations)
            .set({ status: 'accepted' })
            .where(eq(projectInvitations.id, invitation.id));

        // Resolve the organization for the redirect context
        const [existingProject] = await db
            .select({ organizationId: projects.organizationId })
            .from(projects)
            .where(eq(projects.id, invitation.projectId))
            .limit(1);

        // Ensure org membership even for existing project members (backfill for legacy users)
        if (existingProject?.organizationId) {
            await ensureOrgMembership(drizzleAdapter, userId, existingProject.organizationId, 'member');
        }

        context.result = { message: 'You are already a member of this project', projectId: invitation.projectId, organizationId: existingProject?.organizationId ?? null };
        return context;
    }

    // Add as project member
    await db.insert(projectMembers).values({
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
    });

    // Resolve the project's organization and ensure org membership
    const [project] = await db
        .select({ name: projects.name, organizationId: projects.organizationId })
        .from(projects)
        .where(eq(projects.id, invitation.projectId))
        .limit(1);

    if (project?.organizationId) {
        await ensureOrgMembership(drizzleAdapter, userId, project.organizationId, 'member');
    }

    // Mark invitation as accepted
    await db.update(projectInvitations)
        .set({ status: 'accepted' })
        .where(eq(projectInvitations.id, invitation.id));

    // Create notification for the inviter
    const inviteeName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email;

    await db.insert(notifications).values({
        userId: invitation.invitedBy,
        type: 'invitation_accepted',
        title: `${inviteeName} joined "${project?.name || 'your project'}"`,
        body: `Accepted your invitation as ${invitation.role}`,
        metadata: {
            projectId: invitation.projectId,
            userId,
        },
    });

    // Mark the invitation notification as read for the invitee
    await db.update(notifications)
        .set({ read: true })
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.type, 'project_invitation')
            )
        );

    // Auto-mark onboarding as completed for invited users
    const currentPrefs = (authUser.preferences as Record<string, any>) || {};
    if (!currentPrefs.onboardingCompleted) {
        await db.update(users).set({
            preferences: { ...currentPrefs, onboardingCompleted: true },
        }).where(eq(users.id, userId));
    }

    context.result = { message: 'Invitation accepted', projectId: invitation.projectId, organizationId: project?.organizationId ?? null };
    return context;
};

