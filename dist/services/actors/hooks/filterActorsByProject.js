"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterActorsByProject = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adapters_2 = require("../../../adapters");
const roles_1 = require("../../../utils/roles");
/**
 * Filters actors find queries based on project access.
 *
 * If projectId is provided in the query, validates the user has access.
 * Otherwise, returns actors from all projects the user can access.
 */
const filterActorsByProject = async (context) => {
    const user = context.params?.user;
    if (!context.params?.provider)
        return context; // Internal calls bypass
    if (!user)
        throw new Error('Authentication required');
    const query = context.params?.query || {};
    const globalRoles = await (0, roles_1.getUserRoles)(adapters_2.drizzleAdapter, user.id);
    // Superadmin with explicit projectId filter
    if (globalRoles.includes('superadmin')) {
        return context;
    }
    const projectId = query.projectId;
    if (projectId) {
        // Validate user has access to this specific project
        const [membership] = await adapters_1.db
            .select()
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id)))
            .limit(1);
        if (membership)
            return context;
        // Check org-level access
        const [project] = await adapters_1.db
            .select({ organizationId: schema_1.projects.organizationId })
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
            .limit(1);
        if (project?.organizationId) {
            const [orgMembership] = await adapters_1.db
                .select({ role: schema_1.organizationMembers.role })
                .from(schema_1.organizationMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, project.organizationId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, user.id)))
                .limit(1);
            if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
                return context;
            }
        }
        throw new Error('You do not have access to this project');
    }
    // No projectId — scope to user's accessible projects
    const memberProjects = await adapters_1.db
        .select({ projectId: schema_1.projectMembers.projectId })
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.userId, user.id));
    const projectIds = memberProjects.map(m => m.projectId);
    if (projectIds.length === 0) {
        context.result = [];
        return context;
    }
    if (!query.$and)
        query.$and = [];
    query.$and.push((0, drizzle_orm_1.inArray)(schema_1.actors.projectId, projectIds));
    return context;
};
exports.filterActorsByProject = filterActorsByProject;
