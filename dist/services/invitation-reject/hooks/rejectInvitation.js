"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInvitation = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `invitation-reject`.
 *
 * Rejects a project invitation (authenticated).
 * The token comes from `params.route.id` or `data.token`.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const rejectInvitation = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
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
    // Mark as rejected
    await adapters_1.db.update(schema_1.projectInvitations)
        .set({ status: 'rejected' })
        .where((0, drizzle_orm_1.eq)(schema_1.projectInvitations.id, invitation.id));
    // Mark the invitation notification as read
    await adapters_1.db.update(schema_1.notifications)
        .set({ read: true })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.notifications.type, 'project_invitation')));
    context.result = { message: 'Invitation rejected' };
    return context;
};
exports.rejectInvitation = rejectInvitation;
