"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrgMembers = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../../utils/roles");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Before hook for `find` on `org-members`.
 *
 * Lists members of an organization.
 * Must be owner/admin of the org, or superadmin.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findOrgMembers = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const orgId = context.params?.orgId || context.params?.query?.orgId;
    if (!orgId) {
        const error = new Error('orgId query parameter is required');
        error.name = 'ValidationError';
        throw error;
    }
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    // Superadmin bypasses org membership check
    if (!isSuperAdmin) {
        const userRole = await (0, organizationMemberships_1.getUserOrgRole)(adapters_1.drizzleAdapter, user.id, orgId);
        if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
            throw new Error('Authorization: You do not have permission to view organization members');
        }
    }
    const members = await adapters_1.db
        .select({
        id: schema_1.organizationMembers.id,
        userId: schema_1.organizationMembers.userId,
        role: schema_1.organizationMembers.role,
        createdAt: schema_1.organizationMembers.createdAt,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        email: schema_1.users.email,
        avatar: schema_1.users.avatar,
    })
        .from(schema_1.organizationMembers)
        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, schema_1.users.id))
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, orgId));
    context.result = {
        data: members,
        total: members.length,
    };
    return context;
};
exports.findOrgMembers = findOrgMembers;
