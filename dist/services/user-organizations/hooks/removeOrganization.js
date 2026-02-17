"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOrganization = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../../utils/roles");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Before hook for `remove` on `user-organizations`.
 *
 * Deletes an organization. Only the owner or a superadmin can delete.
 * Cannot delete if the org still has projects.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
const removeOrganization = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const id = context.id || context.params?.route?.id;
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    // Check if org exists
    const [org] = await adapters_1.db.select().from(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.id, id)).limit(1);
    if (!org) {
        const error = new Error('Organization not found');
        error.name = 'NotFoundError';
        throw error;
    }
    // Check permissions: must be owner or superadmin
    if (!isSuperAdmin) {
        const userRole = await (0, organizationMemberships_1.getUserOrgRole)(adapters_1.drizzleAdapter, user.id, id);
        if (userRole !== 'owner') {
            throw new Error('Authorization: Only organization owners can delete an organization');
        }
    }
    // Check if org has projects — prevent deletion if it does
    const orgProjects = await adapters_1.db.select({ id: schema_1.projects.id }).from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.organizationId, id)).limit(1);
    if (orgProjects.length > 0) {
        const error = new Error('Cannot delete an organization that has projects. Please delete or move all projects first.');
        error.name = 'ValidationError';
        throw error;
    }
    // Delete organization members first
    await adapters_1.db.delete(schema_1.organizationMembers).where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, id));
    // Clear legacy organizationId for users that reference this org
    await adapters_1.db.update(schema_1.users).set({ organizationId: null }).where((0, drizzle_orm_1.eq)(schema_1.users.organizationId, id));
    // Delete the organization
    await adapters_1.db.delete(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.id, id));
    context.result = { message: 'Organization deleted successfully' };
    return context;
};
exports.removeOrganization = removeOrganization;
