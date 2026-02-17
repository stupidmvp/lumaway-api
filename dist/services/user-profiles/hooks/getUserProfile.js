"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
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
const getUserProfile = async (context) => {
    const targetUserId = context.id || context.params?.route?.id;
    const viewerId = context.params?.user?.id;
    if (!targetUserId) {
        throw new Error('User ID is required');
    }
    // Fetch the target user's basic info
    const [user] = await adapters_1.db
        .select({
        id: schema_1.users.id,
        email: schema_1.users.email,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        avatar: schema_1.users.avatar,
        status: schema_1.users.status,
        organizationId: schema_1.users.organizationId,
        createdAt: schema_1.users.createdAt,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, targetUserId))
        .limit(1);
    if (!user) {
        throw new Error('User not found');
    }
    // Fetch organization name if the user belongs to one
    let organizationName = null;
    if (user.organizationId) {
        const [org] = await adapters_1.db
            .select({ name: schema_1.organizations.name })
            .from(schema_1.organizations)
            .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, user.organizationId))
            .limit(1);
        organizationName = org?.name ?? null;
    }
    // Fetch organization role (from organization_members)
    let organizationRole = null;
    if (user.organizationId) {
        const [orgMember] = await adapters_1.db
            .select({ role: schema_1.organizationMembers.role })
            .from(schema_1.organizationMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, user.organizationId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, targetUserId)))
            .limit(1);
        organizationRole = orgMember?.role ?? null;
    }
    // Find shared projects between the viewer and target user
    let sharedProjects = [];
    if (viewerId && viewerId !== targetUserId) {
        // Get projects where the target user is a member
        const targetMemberships = await adapters_1.db
            .select({
            projectId: schema_1.projectMembers.projectId,
            role: schema_1.projectMembers.role,
        })
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, targetUserId));
        if (targetMemberships.length > 0) {
            // Get projects where the viewer is also a member
            const viewerMemberships = await adapters_1.db
                .select({ projectId: schema_1.projectMembers.projectId })
                .from(schema_1.projectMembers)
                .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, viewerId));
            const viewerProjectIds = new Set(viewerMemberships.map((m) => m.projectId));
            const sharedMemberships = targetMemberships.filter((m) => viewerProjectIds.has(m.projectId));
            if (sharedMemberships.length > 0) {
                for (const membership of sharedMemberships) {
                    const [project] = await adapters_1.db
                        .select({ id: schema_1.projects.id, name: schema_1.projects.name })
                        .from(schema_1.projects)
                        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, membership.projectId))
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
exports.getUserProfile = getUserProfile;
