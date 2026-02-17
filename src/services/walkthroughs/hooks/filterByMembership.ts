import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { organizationMembers, projectMembers, projects, walkthroughs } from '../../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { drizzleAdapter } from '../../../adapters';
import { getUserRoles } from '../../../utils/roles';

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
export const filterByMembership = async (context: HookContext) => {
    const user = context.params?.user;

    // Internal calls skip check
    if (!context.params?.provider) return context;
    if (!user) throw new Error('Authentication required');

    // Read the active organization from the frontend header
    const activeOrgId: string | undefined =
        context.params.headers?.['x-organization-id'] || undefined;

    // Helper: if the query already has a plain projectId string, check it
    // is within an allowed set and, if so, keep it rather than overwriting.
    const preserveExplicitProjectId = (
        allowedIds: string[],
    ): boolean => {
        const requested = context.params?.query?.projectId;
        if (typeof requested === 'string' && allowedIds.includes(requested)) {
            // projectId already in the query and user has access — leave it
            return true;
        }
        return false;
    };

    // Superadmin sees everything (scoped to active org if set)
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) {
        if (activeOrgId) {
            // Scope walkthroughs to projects in the active org
            const orgProjects = await db
                .select({ id: projects.id })
                .from(projects)
                .where(eq(projects.organizationId, activeOrgId));

            const orgProjectIds = orgProjects.map(p => p.id);

            if (!preserveExplicitProjectId(orgProjectIds)) {
                if (orgProjectIds.length === 0) {
                    context.params.query = {
                        ...context.params.query,
                        projectId: '00000000-0000-0000-0000-000000000000',
                    };
                } else {
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
    const orgMemberships = await db
        .select({
            organizationId: organizationMembers.organizationId,
            role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, user.id));

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
            const orgProjects = await db
                .select({ id: projects.id })
                .from(projects)
                .where(eq(projects.organizationId, activeOrgId));

            const orgProjectIds = orgProjects.map(p => p.id);

            if (!preserveExplicitProjectId(orgProjectIds)) {
                if (orgProjectIds.length === 0) {
                    context.params.query = {
                        ...context.params.query,
                        projectId: '00000000-0000-0000-0000-000000000000',
                    };
                } else {
                    context.params.query = {
                        ...context.params.query,
                        projectId: { $in: orgProjectIds },
                    };
                }
            }
            return context;
        }

        // Regular member — only walkthroughs from projects they're explicitly in, scoped to this org
        const memberProjects = await db
            .select({ projectId: projectMembers.projectId })
            .from(projectMembers)
            .innerJoin(projects, eq(projects.id, projectMembers.projectId))
            .where(
                and(
                    eq(projectMembers.userId, user.id),
                    eq(projects.organizationId, activeOrgId)
                )
            );

        const memberProjectIds = memberProjects.map(m => m.projectId);

        if (!preserveExplicitProjectId(memberProjectIds)) {
            if (memberProjectIds.length === 0) {
                context.params.query = {
                    ...context.params.query,
                    projectId: '00000000-0000-0000-0000-000000000000',
                };
            } else {
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
    const directMemberships = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, user.id));

    const directProjectIds = directMemberships.map(m => m.projectId);

    // Build the full list of accessible project IDs
    let accessibleProjectIds = [...directProjectIds];

    if (fullAccessOrgIds.length > 0) {
        const orgProjects = await db
            .select({ id: projects.id })
            .from(projects)
            .where(inArray(projects.organizationId, fullAccessOrgIds));

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
    } else {
        context.params.query = {
            ...context.params.query,
            projectId: { $in: accessibleProjectIds },
        };
    }

    return context;
};
