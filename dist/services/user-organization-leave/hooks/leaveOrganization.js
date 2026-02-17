"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveOrganization = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `user-organization-leave`.
 *
 * Allows a user to leave an organization.
 * Sole owners cannot leave (they must transfer ownership or delete the org).
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const leaveOrganization = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const { organizationId } = context.data;
    if (!organizationId) {
        const error = new Error('organizationId is required');
        error.name = 'ValidationError';
        throw error;
    }
    // Check if user is a member of this org
    const [membership] = await adapters_1.db
        .select()
        .from(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, user.id)))
        .limit(1);
    if (!membership) {
        const error = new Error('You are not a member of this organization');
        error.name = 'ValidationError';
        throw error;
    }
    // If user is an owner, check if they are the only owner
    if (membership.role === 'owner') {
        const owners = await adapters_1.db
            .select({ id: schema_1.organizationMembers.id })
            .from(schema_1.organizationMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.role, 'owner')));
        if (owners.length <= 1) {
            const error = new Error('You are the only owner. Transfer ownership before leaving or delete the organization.');
            error.name = 'ValidationError';
            throw error;
        }
    }
    // Remove user's membership
    await adapters_1.db
        .delete(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.id, membership.id));
    // Clear legacy organizationId if it matches
    await adapters_1.db
        .update(schema_1.users)
        .set({ organizationId: null })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, user.id), (0, drizzle_orm_1.eq)(schema_1.users.organizationId, organizationId)));
    context.result = { message: 'You have left the organization' };
    return context;
};
exports.leaveOrganization = leaveOrganization;
