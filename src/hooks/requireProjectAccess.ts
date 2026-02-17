import { db } from '../adapters';
import { projectMembers, walkthroughs, projects, organizationMembers, actors } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { drizzleAdapter } from '../adapters';
import { getUserRoles } from '../utils/roles';

/**
 * Project role hierarchy: owner > editor > viewer
 * Higher roles inherit all permissions of lower roles.
 */
const ROLE_HIERARCHY: Record<string, number> = {
    viewer: 1,
    editor: 2,
    owner: 3,
};

type ProjectRole = 'owner' | 'editor' | 'viewer';

interface RequireProjectAccessOptions {
    /** Minimum role required to perform the action */
    minRole: ProjectRole;
    /**
     * How to resolve the projectId from the context:
     * - 'direct': context.data.projectId or context.params.query.projectId (for project-level resources)
     * - 'fromId': the resource ID IS the projectId (for project service operations)
     * - 'fromWalkthrough': resolve projectId via walkthroughId in context.data or context.params.query
     * - 'fromWalkthroughSelf': context.id IS a walkthrough ID — resolve its projectId (for walkthrough patch/update/remove)
     * - 'fromActorSelf': context.id IS an actor ID — resolve its projectId (for actor patch/remove)
     */
    resolveProject: 'direct' | 'fromId' | 'fromWalkthrough' | 'fromWalkthroughSelf' | 'fromActorSelf';
    /** Allow the resource owner (userId match) to bypass role check (e.g., edit own comments) */
    allowResourceOwner?: boolean;
}

/**
 * Reusable hook to enforce project-level access control.
 *
 * Usage:
 *   requireProjectAccess({ minRole: 'editor', resolveProject: 'direct' })
 *   requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' })
 */
export function requireProjectAccess(options: RequireProjectAccessOptions) {
    return async (context: any) => {
        const user = context.params?.user;

        // Internal calls (no provider = server-to-server) skip access control
        if (!context.params?.provider) return context;

        if (!user) {
            throw new Error('Authentication required');
        }

        // Superadmin bypasses all project access checks
        const globalRoles = await getUserRoles(drizzleAdapter, user.id);
        if (globalRoles.includes('superadmin')) return context;

        // Resolve projectId based on strategy
        let projectId: string | undefined;

        // In @flex-donec/core, the resource ID is at params.route.id (not context.id)
        const resourceId = context.id ?? context.params?.route?.id;

        switch (options.resolveProject) {
            case 'fromId':
                projectId = resourceId as string;
                break;

            case 'direct':
                projectId =
                    context.data?.projectId ||
                    context.params?.query?.projectId;
                break;

            case 'fromWalkthrough': {
                const walkthroughId =
                    context.data?.walkthroughId ||
                    context.params?.query?.walkthroughId ||
                    resourceId;

                if (walkthroughId) {
                    const [wt] = await db
                        .select({ projectId: walkthroughs.projectId })
                        .from(walkthroughs)
                        .where(eq(walkthroughs.id, walkthroughId as string))
                        .limit(1);

                    projectId = wt?.projectId;
                }
                break;
            }

            case 'fromWalkthroughSelf': {
                // The resource IS the walkthrough (for patch/update/remove on walkthroughs service)
                const wtId = resourceId as string;
                if (wtId) {
                    const [wt] = await db
                        .select({ projectId: walkthroughs.projectId })
                        .from(walkthroughs)
                        .where(eq(walkthroughs.id, wtId))
                        .limit(1);

                    projectId = wt?.projectId;
                }
                break;
            }

            case 'fromActorSelf': {
                // The resource IS the actor (for patch/remove on actors service)
                const actorId = resourceId as string;
                if (actorId) {
                    const [actor] = await db
                        .select({ projectId: actors.projectId })
                        .from(actors)
                        .where(eq(actors.id, actorId))
                        .limit(1);

                    projectId = actor?.projectId;
                }
                break;
            }
        }

        if (!projectId) {
            throw new Error('Could not determine project for access check');
        }

        // 1. Check direct membership in project_members table
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

        if (membership) {
            const userLevel = ROLE_HIERARCHY[membership.role] ?? 0;
            const requiredLevel = ROLE_HIERARCHY[options.minRole] ?? 0;

            if (userLevel < requiredLevel) {
                throw new Error(
                    `Insufficient project permissions. Required: ${options.minRole}, yours: ${membership.role}`
                );
            }

            // Attach membership info to context for downstream hooks
            context.params.projectMembership = membership;
            return context;
        }

        // 2. No direct membership → check org-level access
        //    If user is owner/admin of the org that owns this project, grant access
        const [project] = await db
            .select({ ownerId: projects.ownerId, organizationId: projects.organizationId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check organization membership for org-level access
        if (project.organizationId) {
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
                // Org owner/admin has full project access — synthesize an 'owner' membership
                context.params.projectMembership = {
                    projectId,
                    userId: user.id,
                    role: 'owner',
                    _orgLevel: true, // Flag indicating this is org-level access
                };
                return context;
            }
        }

        // 3. Fallback: check if user is the project creator (projects.ownerId)
        if (project.ownerId === user.id) {
            // Auto-repair: add the creator as an owner member so future checks are fast
            try {
                await db.insert(projectMembers).values({
                    projectId,
                    userId: user.id,
                    role: 'owner',
                });
            } catch {
                // Ignore if already exists (race condition / unique constraint)
            }

            context.params.projectMembership = { projectId, userId: user.id, role: 'owner' };
            return context;
        }

        throw new Error('You are not a member of this project');
    
    };
}

