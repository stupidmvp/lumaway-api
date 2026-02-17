import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { organizationMembers, projectMembers, projects } from '../../../db/schema';
import { eq, inArray, or, and } from 'drizzle-orm';
import { drizzleAdapter } from '../../../adapters';
import { getUserRoles } from '../../../utils/roles';

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
export const filterProjectsByAccess = async (context: HookContext) => {
    const user = context.params?.user;

    // Internal calls (no provider) skip access control
    if (!context.params?.provider) return context;
    if (!user) throw new Error('Authentication required');

    // Read the active organization from the frontend header
    const activeOrgId: string | undefined =
        context.params.headers?.['x-organization-id'] || undefined;

    // Superadmin sees everything (scoped to active org if set)
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
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
    const orgMemberships = await db
        .select({
            organizationId: organizationMembers.organizationId,
            role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, user.id));

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
    const memberProjects = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, user.id));

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
        const orgProjects = await db
            .select({ id: projects.id })
            .from(projects)
            .where(inArray(projects.organizationId, fullAccessOrgIds));

        const orgProjectIds = orgProjects.map(p => p.id);
        const allAccessibleIds = [...new Set([...orgProjectIds, ...memberProjectIds])];

        context.params.query = {
            ...context.params.query,
            id: { $in: allAccessibleIds },
        };
    } else if (fullAccessOrgIds.length > 0) {
        if (fullAccessOrgIds.length === 1) {
            context.params.query = {
                ...context.params.query,
                organizationId: fullAccessOrgIds[0],
            };
        } else {
            context.params.query = {
                ...context.params.query,
                organizationId: { $in: fullAccessOrgIds },
            };
        }
    } else {
        context.params.query = {
            ...context.params.query,
            id: { $in: memberProjectIds },
        };
    }

    return context;
};

