"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserOrganizations = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
const roles_1 = require("../../../utils/roles");
/**
 * Before hook for `find` on `me-organizations`.
 *
 * Returns all organizations the authenticated user belongs to.
 * Superadmin users see ALL organizations as synthetic owner memberships.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findUserOrganizations = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    // Superadmin: return all organizations
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) {
        const allOrgs = await adapters_1.db.select({
            id: schema_1.organizations.id,
            name: schema_1.organizations.name,
            slug: schema_1.organizations.slug,
            logo: schema_1.organizations.logo,
        }).from(schema_1.organizations);
        context.result = {
            data: allOrgs.map((org) => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo: org.logo,
                role: 'owner',
                membershipId: org.id,
            })),
            total: allOrgs.length,
        };
        return context;
    }
    // Regular user: return their memberships
    const memberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, user.id);
    context.result = {
        data: memberships.map(m => ({
            id: m.organization?.id,
            name: m.organization?.name,
            slug: m.organization?.slug,
            logo: m.organization?.logo,
            role: m.role,
            membershipId: m.id,
        })),
        total: memberships.length,
    };
    return context;
};
exports.findUserOrganizations = findUserOrganizations;
