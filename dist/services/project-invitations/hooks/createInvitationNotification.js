"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitationNotification = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * After create: if the invitee already has an account, create a notification for them.
 */
const createInvitationNotification = async (context) => {
    const invitation = context.result;
    if (!invitation)
        return context;
    try {
        // Check if user exists
        const [invitee] = await adapters_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, invitation.email.toLowerCase()))
            .limit(1);
        if (!invitee)
            return context; // No account yet, they'll see it when they register
        // Get project name for notification
        const [project] = await adapters_1.db
            .select({ name: schema_1.projects.name })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, invitation.projectId))
            .limit(1);
        // Get inviter name
        const [inviter] = await adapters_1.db
            .select({ firstName: schema_1.users.firstName, lastName: schema_1.users.lastName })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, invitation.invitedBy))
            .limit(1);
        const inviterName = inviter
            ? [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || 'Someone'
            : 'Someone';
        await adapters_1.db.insert(schema_1.notifications).values({
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
    }
    catch (error) {
        console.error('Error creating invitation notification:', error);
    }
    return context;
};
exports.createInvitationNotification = createInvitationNotification;
