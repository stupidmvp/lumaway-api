"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvitationDetails = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `get` on `invitation-details`.
 *
 * Gets invitation details by token (public endpoint).
 *
 * Sets `context.result` to short-circuit the default service get.
 */
const getInvitationDetails = async (context) => {
    const token = context.id || context.params?.route?.id;
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
        // Auto-mark as expired
        await adapters_1.db.update(schema_1.projectInvitations)
            .set({ status: 'expired' })
            .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.id, invitation.id));
        throw new Error('Invitation has expired');
    }
    // Get project and inviter info for display
    const [project] = await adapters_1.db
        .select({ id: schema_1.projects.id, name: schema_1.projects.name })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, invitation.projectId))
        .limit(1);
    const [inviter] = await adapters_1.db
        .select({ firstName: schema_1.users.firstName, lastName: schema_1.users.lastName, email: schema_1.users.email, avatar: schema_1.users.avatar })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, invitation.invitedBy))
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
exports.getInvitationDetails = getInvitationDetails;
