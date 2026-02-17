"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterProjectsByAccess = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adapters_2 = require("../../../adapters");
const roles_1 = require("../../../utils/roles");
/**
 * Filters the projects.find query based on the user's access:
 *
 * - Superadmin: sees all projects (scoped to active org if header present)
 * - Org owner/admin: sees ALL projects in their organization(s)
 * - Org member: sees ONLY projects they're explicitly in via project_members
 *
 * When the `X-Organization-Id` header is present, results are further
 * scoped to that specific organization (workspace switcher).
 */
const filterProjectsByAccess = async (context) => {
    const user = context.params?.user;
    // Internal calls (no provider) skip access control
    if (!context.params?.provider)
        return context;
    if (!user)
        throw new Error('Authentication required');
    // Read the active organization from the frontend header
    const activeOrgId = context.params.headers?.['x-organization-id'] || undefined;
    // Superadmin sees everything (scoped to active org if set)
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_2.drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) {
        if (activeOrgId) {
            context.params.query = {
                ...context.params.query,
                organizationId: activeOrgId,
            };
        }
        return context;
    }
    // Get user's organization memberships
    const orgMemberships = await adapters_1.db
        .select({
        organizationId: schema_1.organizationMembers.organizationId,
        role: schema_1.organizationMembers.role,
    })
        .from(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, user.id));
    // If active org header is set, verify user is a member and scope to that org
    if (activeOrgId) {
        const activeMembership = orgMemberships.find(m => m.organizationId === activeOrgId);
        if (!activeMembership) {
            // User is not a member of the requested org — return empty
            context.params.query = {
                ...context.params.query,
                id: '00000000-0000-0000-0000-000000000000',
            };
            return context;
        }
        if (activeMembership.role === 'owner' || activeMembership.role === 'admin') {
            // Full access to all projects in this org
            context.params.query = {
                ...context.params.query,
                organizationId: activeOrgId,
            };
            return context;
        }
        // Regular member — only show projects they're explicitly in, scoped to this org
        const memberProjects = await adapters_1.db
            .select({ projectId: schema_1.projectMembers.projectId })
            .from(schema_1.projectMembers)
            .innerJoin(schema_1.projects, (0, drizzle_orm_1.eq)(schema_1.projects.id, schema_1.projectMembers.projectId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.projects.organizationId, activeOrgId)));
        const memberProjectIds = memberProjects.map(m => m.projectId);
        if (memberProjectIds.length === 0) {
            context.params.query = {
                ...context.params.query,
                id: '00000000-0000-0000-0000-000000000000',
            };
            return context;
        }
        context.params.query = {
            ...context.params.query,
            id: { $in: memberProjectIds },
        };
        return context;
    }
    // ── No active org header: legacy behavior (show all accessible) ──
    // Org IDs where user is owner/admin (full access to all projects)
    const fullAccessOrgIds = orgMemberships
        .filter(m => m.role === 'owner' || m.role === 'admin')
        .map(m => m.organizationId);
    // Get explicit project memberships (for 'member' role orgs or direct invites)
    const memberProjects = await adapters_1.db
        .select({ projectId: schema_1.projectMembers.projectId })
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id));
    const memberProjectIds = memberProjects.map(m => m.projectId);
    // If user has no access at all, return empty
    if (fullAccessOrgIds.length === 0 && memberProjectIds.length === 0) {
        context.params.query = {
            ...context.params.query,
            id: '00000000-0000-0000-0000-000000000000',
        };
        return context;
    }
    context.params._accessFilter = {
        fullAccessOrgIds,
        memberProjectIds,
    };
    if (fullAccessOrgIds.length > 0 && memberProjectIds.length > 0) {
        const orgProjects = await adapters_1.db
            .select({ id: schema_1.projects.id })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.inArray)(schema_1.projects.organizationId, fullAccessOrgIds));
        const orgProjectIds = orgProjects.map(p => p.id);
        const allAccessibleIds = [...new Set([...orgProjectIds, ...memberProjectIds])];
        context.params.query = {
            ...context.params.query,
            id: { $in: allAccessibleIds },
        };
    }
    else if (fullAccessOrgIds.length > 0) {
        if (fullAccessOrgIds.length === 1) {
            context.params.query = {
                ...context.params.query,
                organizationId: fullAccessOrgIds[0],
            };
        }
        else {
            context.params.query = {
                ...context.params.query,
                organizationId: { $in: fullAccessOrgIds },
            };
        }
    }
    else {
        context.params.query = {
            ...context.params.query,
            id: { $in: memberProjectIds },
        };
    }
    return context;
};
exports.filterProjectsByAccess = filterProjectsByAccess;
