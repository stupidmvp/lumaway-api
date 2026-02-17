"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findActiveOrganization = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
const roles_1 = require("../../../utils/roles");
/**
 * Before hook for `find` on `me-organization`.
 *
 * Returns the user's active organization.
 * Uses `X-Organization-Id` header when present; otherwise falls back to highest-role org.
 * Superadmin can access any organization.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findActiveOrganization = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    const activeOrgId = context.params?.headers?.['x-organization-id'];
    // Superadmin: can access any organization directly
    if (isSuperAdmin) {
        if (activeOrgId) {
            const [org] = await adapters_1.db.select({
                id: schema_1.organizations.id,
                name: schema_1.organizations.name,
                slug: schema_1.organizations.slug,
                logo: schema_1.organizations.logo,
            }).from(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.id, activeOrgId)).limit(1);
            if (org) {
                context.result = { ...org, role: 'owner' };
                return context;
            }
        }
        // Fallback: first org in system
        const [firstOrg] = await adapters_1.db.select({
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
            slug: schema_1.organizations.slug,
            logo: schema_1.organizations.logo,
        }).from(schema_1.organizations).limit(1);
        context.result = firstOrg ? { ...firstOrg, role: 'owner' } : null;
        return context;
    }
    const memberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, user.id);
    if (memberships.length === 0) {
        context.result = null;
        return context;
    }
    // If the frontend sends the active org header, use it
    let target = activeOrgId
        ? memberships.find(m => m.organizationId === activeOrgId)
        : undefined;
    // Fallback: highest-role org
    if (!target) {
        const priority = ['owner', 'admin', 'member'];
        const sorted = [...memberships].sort((a, b) => priority.indexOf(a.role) - priority.indexOf(b.role));
        target = sorted[0];
    }
    const org = target.organization;
    context.result = {
        id: org?.id,
        name: org?.name,
        slug: org?.slug,
        logo: org?.logo,
        role: target.role,
    };
    return context;
};
exports.findActiveOrganization = findActiveOrganization;
