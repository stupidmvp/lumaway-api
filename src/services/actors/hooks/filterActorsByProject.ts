import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { actors, organizationMembers, projectMembers, projects } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { drizzleAdapter } from '../../../adapters';
import { getUserRoles } from '../../../utils/roles';

/**
 * Filters actors find queries based on project access.
 *
 * If projectId is provided in the query, validates the user has access.
 * Otherwise, returns actors from all projects the user can access.
 */
export const filterActorsByProject = async (context: HookContext) => {
    const user = context.params?.user;
    if (!context.params?.provider) return context; // Internal calls bypass

    if (!user) throw new Error('Authentication required');

    const query = context.params?.query || {};
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);

    // Superadmin with explicit projectId filter
    if (globalRoles.includes('superadmin')) {
        return context;
    }

    const projectId = query.projectId;

    if (projectId) {
        // Validate user has access to this specific project
        const [membership] = await db
            .select()
            .from(projectMembers)
            .where(
                and(
                    eq(projectMembers.projectId, projectId),
                    eq(projectMembers.userId, user.id)
                )
            )
            .limit(1);

        if (membership) return context;

        // Check org-level access
        const [project] = await db
            .select({ organizationId: projects.organizationId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (project?.organizationId) {
            const [orgMembership] = await db
                .select({ role: organizationMembers.role })
                .from(organizationMembers)
                .where(
                    and(
                        eq(organizationMembers.organizationId, project.organizationId),
                        eq(organizationMembers.userId, user.id)
                    )
                )
                .limit(1);

            if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
                return context;
            }
        }

        throw new Error('You do not have access to this project');
    }

    // No projectId — scope to user's accessible projects
    const memberProjects = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, user.id));

    const projectIds = memberProjects.map(m => m.projectId);

    if (projectIds.length === 0) {
        context.result = [];
        return context;
    }

    if (!query.$and) query.$and = [];
    query.$and.push(inArray(actors.projectId, projectIds));

    return context;
};
