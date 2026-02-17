"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByMembership = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adapters_2 = require("../../../adapters");
const roles_1 = require("../../../utils/roles");
/**
 * Filters walkthrough find queries based on the user's access:
 *
 * - Superadmin: sees all walkthroughs (scoped to active org if header present)
 * - Org owner/admin: sees all walkthroughs from projects in their organization(s)
 * - Org member / project member: sees only walkthroughs from projects they're explicitly a member of
 *
 * When the `X-Organization-Id` header is present, results are further
 * scoped to that specific organization (workspace switcher).
 *
 * When a specific `projectId` is provided in the query, it validates that
 * the user has access to that project before allowing the query through.
 */
const filterByMembership = async (context) => {
    const user = context.params?.user;
    // Internal calls skip check
    if (!context.params?.provider)
        return context;
    if (!user)
        throw new Error('Authentication required');
    // Read the active organization from the frontend header
    const activeOrgId = context.params.headers?.['x-organization-id'] || undefined;
    // Helper: if the query already has a plain projectId string, check it
    // is within an allowed set and, if so, keep it rather than overwriting.
    const preserveExplicitProjectId = (allowedIds) => {
        const requested = context.params?.query?.projectId;
        if (typeof requested === 'string' && allowedIds.includes(requested)) {
            // projectId already in the query and user has access — leave it
            return true;
        }
        return false;
    };
    // Superadmin sees everything (scoped to active org if set)
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_2.drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) {
        if (activeOrgId) {
            // Scope walkthroughs to projects in the active org
            const orgProjects = await adapters_1.db
                .select({ id: schema_1.projects.id })
                .from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.organizationId, activeOrgId));
            const orgProjectIds = orgProjects.map(p => p.id);
            if (!preserveExplicitProjectId(orgProjectIds)) {
                if (orgProjectIds.length === 0) {
                    context.params.query = {
                        ...context.params.query,
                        projectId: '00000000-0000-0000-0000-000000000000',
                    };
                }
                else {
                    context.params.query = {
                        ...context.params.query,
                        projectId: { $in: orgProjectIds },
                    };
                }
            }
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
    // ── Active org header present: scope to that org ──
    if (activeOrgId) {
        const activeMembership = orgMemberships.find(m => m.organizationId === activeOrgId);
        if (!activeMembership) {
            // User is not a member of the requested org — return empty
            context.params.query = {
                ...context.params.query,
                projectId: '00000000-0000-0000-0000-000000000000',
            };
            return context;
        }
        if (activeMembership.role === 'owner' || activeMembership.role === 'admin') {
            // Full access to all walkthroughs in projects of this org
            const orgProjects = await adapters_1.db
                .select({ id: schema_1.projects.id })
                .from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.organizationId, activeOrgId));
            const orgProjectIds = orgProjects.map(p => p.id);
            if (!preserveExplicitProjectId(orgProjectIds)) {
                if (orgProjectIds.length === 0) {
                    context.params.query = {
                        ...context.params.query,
                        projectId: '00000000-0000-0000-0000-000000000000',
                    };
                }
                else {
                    context.params.query = {
                        ...context.params.query,
                        projectId: { $in: orgProjectIds },
                    };
                }
            }
            return context;
        }
        // Regular member — only walkthroughs from projects they're explicitly in, scoped to this org
        const memberProjects = await adapters_1.db
            .select({ projectId: schema_1.projectMembers.projectId })
            .from(schema_1.projectMembers)
            .innerJoin(schema_1.projects, (0, drizzle_orm_1.eq)(schema_1.projects.id, schema_1.projectMembers.projectId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.projects.organizationId, activeOrgId)));
        const memberProjectIds = memberProjects.map(m => m.projectId);
        if (!preserveExplicitProjectId(memberProjectIds)) {
            if (memberProjectIds.length === 0) {
                context.params.query = {
                    ...context.params.query,
                    projectId: '00000000-0000-0000-0000-000000000000',
                };
            }
            else {
                context.params.query = {
                    ...context.params.query,
                    projectId: { $in: memberProjectIds },
                };
            }
        }
        return context;
    }
    // ── No active org header: legacy behavior (show all accessible) ──
    // Org IDs where user is owner/admin → full access to all projects in those orgs
    const fullAccessOrgIds = orgMemberships
        .filter(m => m.role === 'owner' || m.role === 'admin')
        .map(m => m.organizationId);
    // Direct project memberships (for 'member' role or invited users)
    const directMemberships = await adapters_1.db
        .select({ projectId: schema_1.projectMembers.projectId })
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id));
    const directProjectIds = directMemberships.map(m => m.projectId);
    // Build the full list of accessible project IDs
    let accessibleProjectIds = [...directProjectIds];
    if (fullAccessOrgIds.length > 0) {
        const orgProjects = await adapters_1.db
            .select({ id: schema_1.projects.id })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.inArray)(schema_1.projects.organizationId, fullAccessOrgIds));
        const orgProjectIds = orgProjects.map(p => p.id);
        accessibleProjectIds = [...new Set([...accessibleProjectIds, ...orgProjectIds])];
    }
    // If user has no accessible projects at all, return empty
    if (accessibleProjectIds.length === 0) {
        context.params.query = {
            ...context.params.query,
            projectId: '00000000-0000-0000-0000-000000000000', // UUID that won't match
        };
        return context;
    }
    // If a specific projectId filter is provided, validate access
    const requestedProjectId = context.params?.query?.projectId;
    if (requestedProjectId) {
        if (!accessibleProjectIds.includes(requestedProjectId)) {
            throw new Error('You are not a member of this project');
        }
        // User has access — let the query through with the projectId filter intact
        return context;
    }
    // No specific projectId requested → filter to only accessible projects
    if (accessibleProjectIds.length === 1) {
        context.params.query = {
            ...context.params.query,
            projectId: accessibleProjectIds[0],
        };
    }
    else {
        context.params.query = {
            ...context.params.query,
            projectId: { $in: accessibleProjectIds },
        };
    }
    return context;
};
exports.filterByMembership = filterByMembership;
