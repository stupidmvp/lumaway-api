"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitation = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Before hook for `create` on `invitation-accept`.
 *
 * Accepts a project invitation (authenticated).
 * The token comes from `params.route.id` or `data.token`.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const acceptInvitation = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
    // Token can come from route param or body
    const token = context.params?.route?.id || context.data?.token;
    if (!token) {
        throw new Error('Invitation token is required');
    }
    const [invitation] = await adapters_1.db
        .select()
        .from(schema_1.projectInvitations)
        .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.token, token))
        .limit(1);
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    if (invitation.status !== 'pending') {
        throw new Error(`Invitation already ${invitation.status}`);
    }
    if (new Date(invitation.expiresAt) < new Date()) {
        await adapters_1.db.update(schema_1.projectInvitations)
            .set({ status: 'expired' })
            .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.id, invitation.id));
        throw new Error('Invitation has expired');
    }
    // Verify that the authenticated user's email matches the invitation
    const [authUser] = await adapters_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
        .limit(1);
    if (!authUser || authUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address');
    }
    // Check if already a member
    const [existingMember] = await adapters_1.db
        .select()
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, invitation.projectId), (0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, userId)))
        .limit(1);
    if (existingMember) {
        // Already a member — just mark invitation as accepted
        await adapters_1.db.update(schema_1.projectInvitations)
            .set({ status: 'accepted' })
            .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.id, invitation.id));
        // Resolve the organization for the redirect context
        const [existingProject] = await adapters_1.db
            .select({ organizationId: schema_1.projects.organizationId })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, invitation.projectId))
            .limit(1);
        // Ensure org membership even for existing project members (backfill for legacy users)
        if (existingProject?.organizationId) {
            await (0, organizationMemberships_1.ensureOrgMembership)(adapters_1.drizzleAdapter, userId, existingProject.organizationId, 'member');
        }
        context.result = { message: 'You are already a member of this project', projectId: invitation.projectId, organizationId: existingProject?.organizationId ?? null };
        return context;
    }
    // Add as project member
    await adapters_1.db.insert(schema_1.projectMembers).values({
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
    });
    // Resolve the project's organization and ensure org membership
    const [project] = await adapters_1.db
        .select({ name: schema_1.projects.name, organizationId: schema_1.projects.organizationId })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, invitation.projectId))
        .limit(1);
    if (project?.organizationId) {
        await (0, organizationMemberships_1.ensureOrgMembership)(adapters_1.drizzleAdapter, userId, project.organizationId, 'member');
    }
    // Mark invitation as accepted
    await adapters_1.db.update(schema_1.projectInvitations)
        .set({ status: 'accepted' })
        .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.id, invitation.id));
    // Create notification for the inviter
    const inviteeName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email;
    await adapters_1.db.insert(schema_1.notifications).values({
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
    await adapters_1.db.update(schema_1.notifications)
        .set({ read: true })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.notifications.type, 'project_invitation')));
    // Auto-mark onboarding as completed for invited users
    const currentPrefs = authUser.preferences || {};
    if (!currentPrefs.onboardingCompleted) {
        await adapters_1.db.update(schema_1.users).set({
            preferences: { ...currentPrefs, onboardingCompleted: true },
        }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    }
    context.result = { message: 'Invitation accepted', projectId: invitation.projectId, organizationId: project?.organizationId ?? null };
    return context;
};
exports.acceptInvitation = acceptInvitation;
