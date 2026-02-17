"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCurrentUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("../../../utils/roles");
const organizationMemberships_1 = require("../../../utils/organizationMemberships");
/**
 * Helper: fetch ALL organizations in the system (for superadmin).
 * Returns them mapped as synthetic "owner" memberships so the
 * frontend org-switcher works seamlessly.
 */
async function getAllOrganizationsAsMemberships() {
    const allOrgs = await adapters_1.db.select({
        id: schema_1.organizations.id,
        name: schema_1.organizations.name,
        slug: schema_1.organizations.slug,
        logo: schema_1.organizations.logo,
    }).from(schema_1.organizations);
    return allOrgs.map((org) => ({
        organizationId: org.id,
        role: 'owner',
        organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
        },
    }));
}
/**
 * Before hook for `find` on `me`.
 *
 * Returns the current user profile with global roles,
 * organization memberships, and project memberships.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findCurrentUser = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    // Fetch the user's latest data
    const [freshUser] = await adapters_1.db.select({
        id: schema_1.users.id,
        email: schema_1.users.email,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        avatar: schema_1.users.avatar,
        status: schema_1.users.status,
        organizationId: schema_1.users.organizationId,
        preferences: schema_1.users.preferences,
        createdAt: schema_1.users.createdAt,
    }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id)).limit(1);
    if (!freshUser)
        throw new Error('User not found');
    // Fetch global roles, org memberships, and project memberships in parallel
    let [globalRoles, orgMemberships, projectMemberships] = await Promise.all([
        (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, freshUser.id),
        (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, freshUser.id),
        adapters_1.db.select({
            projectId: schema_1.projectMembers.projectId,
            role: schema_1.projectMembers.role,
        })
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, freshUser.id)),
    ]);
    // Superadmin: return ALL organizations as synthetic owner memberships
    if (globalRoles.includes('superadmin')) {
        const allOrgMemberships = await getAllOrganizationsAsMemberships();
        context.result = {
            ...freshUser,
            globalRoles,
            organizationMemberships: allOrgMemberships.map((m) => ({
                organizationId: m.organizationId,
                role: m.role,
                organization: m.organization,
            })),
            projectMemberships: projectMemberships.map((pm) => ({
                projectId: pm.projectId,
                role: pm.role,
            })),
        };
        return context;
    }
    // Backfill: reconcile org memberships for legacy users
    if (projectMemberships.length > 0) {
        const existingOrgIds = new Set(orgMemberships.map((m) => m.organizationId));
        const userProjectIds = projectMemberships.map((pm) => pm.projectId);
        const projectOrgs = await adapters_1.db
            .select({ id: schema_1.projects.id, organizationId: schema_1.projects.organizationId })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.inArray)(schema_1.projects.id, userProjectIds));
        const missingOrgIds = new Set();
        for (const po of projectOrgs) {
            if (po.organizationId && !existingOrgIds.has(po.organizationId)) {
                missingOrgIds.add(po.organizationId);
            }
        }
        if (missingOrgIds.size > 0) {
            await Promise.all(Array.from(missingOrgIds).map(orgId => (0, organizationMemberships_1.ensureOrgMembership)(adapters_1.drizzleAdapter, freshUser.id, orgId, 'member')));
            orgMemberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, freshUser.id);
        }
    }
    // Backfill: user has legacy organizationId but no org membership
    if (freshUser.organizationId && orgMemberships.length === 0) {
        await (0, organizationMemberships_1.ensureOrgMembership)(adapters_1.drizzleAdapter, freshUser.id, freshUser.organizationId, 'member');
        orgMemberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, freshUser.id);
    }
    context.result = {
        ...freshUser,
        globalRoles,
        organizationMemberships: orgMemberships.map((m) => ({
            organizationId: m.organizationId,
            role: m.role,
            organization: m.organization,
        })),
        projectMemberships: projectMemberships.map((pm) => ({
            projectId: pm.projectId,
            role: pm.role,
        })),
    };
    return context;
};
exports.findCurrentUser = findCurrentUser;
