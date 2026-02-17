"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchOrgMember = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../../utils/roles");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Before hook for `patch` on `org-members`.
 *
 * Updates a member's role. Only owners or superadmins can change roles.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchOrgMember = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const memberId = context.id || context.params?.route?.id;
    const { role } = context.data;
    if (!role || !['owner', 'admin', 'member'].includes(role)) {
        const error = new Error('Invalid role. Must be owner, admin, or member');
        error.name = 'ValidationError';
        throw error;
    }
    // Get the membership being updated
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
            throw new Error('Authorization: Only organization owners can change member roles');
        }
    }
    // Prevent demoting yourself
    if (membership.userId === user.id && role !== 'owner' && !isSuperAdmin) {
        const error = new Error('You cannot demote yourself');
        error.name = 'ValidationError';
        throw error;
    }
    const [updated] = await adapters_1.db
        .update(schema_1.organizationMembers)
        .set({ role })
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.id, memberId))
        .returning();
    context.result = updated;
    return context;
};
exports.patchOrgMember = patchOrgMember;
