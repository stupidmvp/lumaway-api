"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchActiveOrganization = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
const roles_1 = require("../../../utils/roles");
/**
 * Before hook for `patch` on `me-organization`.
 *
 * Updates the active organization.
 * Must be owner or admin of the organization, or superadmin.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchActiveOrganization = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    const activeOrgId = context.params?.headers?.['x-organization-id'];
    let targetOrgId;
    if (isSuperAdmin) {
        targetOrgId = activeOrgId;
        if (!targetOrgId) {
            throw new Error('X-Organization-Id header is required for superadmin');
        }
    }
    else {
        const memberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, user.id);
        const adminMembership = activeOrgId
            ? memberships.find(m => m.organizationId === activeOrgId && (m.role === 'owner' || m.role === 'admin'))
            : memberships.find(m => m.role === 'owner' || m.role === 'admin');
        if (!adminMembership) {
            throw new Error('Authorization: You do not have permission to update any organization');
        }
        targetOrgId = adminMembership.organizationId;
    }
    const data = context.data;
    const { name, slug, logo } = data;
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (slug !== undefined)
        updateData.slug = slug;
    if (logo !== undefined)
        updateData.logo = logo;
    const [updated] = await adapters_1.db
        .update(schema_1.organizations)
        .set({ ...updateData, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, targetOrgId))
        .returning();
    context.result = updated;
    return context;
};
exports.patchActiveOrganization = patchActiveOrganization;
