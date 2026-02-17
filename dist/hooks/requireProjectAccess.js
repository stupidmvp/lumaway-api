"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireProjectAccess = requireProjectAccess;
const adapters_1 = require("../adapters");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adapters_2 = require("../adapters");
const roles_1 = require("../utils/roles");
/**
 * Project role hierarchy: owner > editor > viewer
 * Higher roles inherit all permissions of lower roles.
 */
const ROLE_HIERARCHY = {
    viewer: 1,
    editor: 2,
    owner: 3,
};
/**
 * Reusable hook to enforce project-level access control.
 *
 * Usage:
 *   requireProjectAccess({ minRole: 'editor', resolveProject: 'direct' })
 *   requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' })
 */
function requireProjectAccess(options) {
    return async (context) => {
        const user = context.params?.user;
        // Internal calls (no provider = server-to-server) skip access control
        if (!context.params?.provider)
            return context;
        if (!user) {
            throw new Error('Authentication required');
        }
        // Superadmin bypasses all project access checks
        const globalRoles = await (0, roles_1.getUserRoles)(adapters_2.drizzleAdapter, user.id);
        if (globalRoles.includes('superadmin'))
            return context;
        // Resolve projectId based on strategy
        let projectId;
        // In @flex-donec/core, the resource ID is at params.route.id (not context.id)
        const resourceId = context.id ?? context.params?.route?.id;
        switch (options.resolveProject) {
            case 'fromId':
                projectId = resourceId;
                break;
            case 'direct':
                projectId =
                    context.data?.projectId ||
                        context.params?.query?.projectId;
                break;
            case 'fromWalkthrough': {
                const walkthroughId = context.data?.walkthroughId ||
                    context.params?.query?.walkthroughId ||
                    resourceId;
                if (walkthroughId) {
                    const [wt] = await adapters_1.db
                        .select({ projectId: schema_1.walkthroughs.projectId })
                        .from(schema_1.walkthroughs)
                        .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, walkthroughId))
                        .limit(1);
                    projectId = wt?.projectId;
                }
                break;
            }
            case 'fromWalkthroughSelf': {
                // The resource IS the walkthrough (for patch/update/remove on walkthroughs service)
                const wtId = resourceId;
                if (wtId) {
                    const [wt] = await adapters_1.db
                        .select({ projectId: schema_1.walkthroughs.projectId })
                        .from(schema_1.walkthroughs)
                        .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, wtId))
                        .limit(1);
                    projectId = wt?.projectId;
                }
                break;
            }
        }
        if (!projectId) {
            throw new Error('Could not determine project for access check');
        }
        // 1. Check direct membership in project_members table
        const [membership] = await adapters_1.db
            .select()
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id)))
            .limit(1);
        if (membership) {
            const userLevel = ROLE_HIERARCHY[membership.role] ?? 0;
            const requiredLevel = ROLE_HIERARCHY[options.minRole] ?? 0;
            if (userLevel < requiredLevel) {
                throw new Error(`Insufficient project permissions. Required: ${options.minRole}, yours: ${membership.role}`);
            }
            // Attach membership info to context for downstream hooks
            context.params.projectMembership = membership;
            return context;
        }
        // 2. No direct membership → check org-level access
        //    If user is owner/admin of the org that owns this project, grant access
        const [project] = await adapters_1.db
            .select({ ownerId: schema_1.projects.ownerId, organizationId: schema_1.projects.organizationId })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
            .limit(1);
        if (!project) {
            throw new Error('Project not found');
        }
        // Check organization membership for org-level access
        if (project.organizationId) {
            const [orgMembership] = await adapters_1.db
                .select({ role: schema_1.organizationMembers.role })
                .from(schema_1.organizationMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, project.organizationId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, user.id)))
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
                await adapters_1.db.insert(schema_1.projectMembers).values({
                    projectId,
                    userId: user.id,
                    role: 'owner',
                });
            }
            catch {
                // Ignore if already exists (race condition / unique constraint)
            }
            context.params.projectMembership = { projectId, userId: user.id, role: 'owner' };
            return context;
        }
        throw new Error('You are not a member of this project');
    };
}
