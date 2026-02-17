import { db } from '../../../adapters';
import { users, organizations, organizationMembers, projectMembers, projects } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Before hook for `get` on `user-profiles`.
 *
 * Returns public-facing user info:
 *   - id, firstName, lastName, avatar, email, status, createdAt
 *   - organization name (if any)
 *   - shared projects (projects where both the viewer and target user are members)
 *
 * Requires authentication (handled in hooks config).
 * Sets `context.result` to short-circuit the default service get.
 */
export const getUserProfile = async (context: any) => {
    const targetUserId = context.id || context.params?.route?.id;
    const viewerId = context.params?.user?.id;

    if (!targetUserId) {
        throw new Error('User ID is required');
    }

    // Fetch the target user's basic info
    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
            status: users.status,
            organizationId: users.organizationId,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

    if (!user) {
        throw new Error('User not found');
    }

    // Fetch organization name if the user belongs to one
    let organizationName: string | null = null;
    if (user.organizationId) {
        const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, user.organizationId))
            .limit(1);
        organizationName = org?.name ?? null;
    }

    // Fetch organization role (from organization_members)
    let organizationRole: string | null = null;
    if (user.organizationId) {
        const [orgMember] = await db
            .select({ role: organizationMembers.role })
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, user.organizationId),
                    eq(organizationMembers.userId, targetUserId)
                )
            )
            .limit(1);
        organizationRole = orgMember?.role ?? null;
    }

    // Find shared projects between the viewer and target user
    let sharedProjects: { id: string; name: string; role: string }[] = [];
    if (viewerId && viewerId !== targetUserId) {
        // Get projects where the target user is a member
        const targetMemberships = await db
            .select({
                projectId: projectMembers.projectId,
                role: projectMembers.role,
            })
            .from(projectMembers)
            .where(eq(projectMembers.userId, targetUserId));

        if (targetMemberships.length > 0) {
            // Get projects where the viewer is also a member
            const viewerMemberships = await db
                .select({ projectId: projectMembers.projectId })
                .from(projectMembers)
                .where(eq(projectMembers.userId, viewerId));

            const viewerProjectIds = new Set(viewerMemberships.map((m) => m.projectId));
            const sharedMemberships = targetMemberships.filter((m) => viewerProjectIds.has(m.projectId));

            if (sharedMemberships.length > 0) {
                for (const membership of sharedMemberships) {
                    const [project] = await db
                        .select({ id: projects.id, name: projects.name })
                        .from(projects)
                        .where(eq(projects.id, membership.projectId))
                        .limit(1);
                    if (project) {
                        sharedProjects.push({
                            id: project.id,
                            name: project.name,
                            role: membership.role,
                        });
                    }
                }
            }
        }
    }

    context.result = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        organization: organizationName,
        organizationRole,
        sharedProjects,
    };

    return context;
};

