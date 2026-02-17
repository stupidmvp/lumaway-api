"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOrgMember = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../../utils/roles");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Before hook for `remove` on `org-members`.
 *
 * Removes a member from an organization.
 * Only owners or superadmins can remove members.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
const removeOrgMember = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const memberId = context.id || context.params?.route?.id;
    // Get the membership being removed
    const [membership] = await adapters_1.db
        .select()
        .from(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.id, memberId))
        .limit(1);
    if (!membership) {
        const error = new Error('Membership not found');
        error.name = 'NotFoundError';
        throw error;
    }
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    if (!isSuperAdmin) {
        const userRole = await (0, organizationMemberships_1.getUserOrgRole)(adapters_1.drizzleAdapter, user.id, membership.organizationId);
        if (userRole !== 'owner') {
            throw new Error('Authorization: Only organization owners can remove members');
        }
    }
    // Prevent removing yourself
    if (membership.userId === user.id) {
        const error = new Error('You cannot remove yourself from the organization');
        error.name = 'ValidationError';
        throw error;
    }
    await adapters_1.db
        .delete(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.id, memberId));
    // Clear the user's legacy organizationId if it matches
    await adapters_1.db
        .update(schema_1.users)
        .set({ organizationId: null })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, membership.userId), (0, drizzle_orm_1.eq)(schema_1.users.organizationId, membership.organizationId)));
    context.result = { message: 'Member removed from organization' };
    return context;
};
exports.removeOrgMember = removeOrgMember;
