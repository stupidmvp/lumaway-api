"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeProjectOwner = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before find: excludes the project owner (author) from the members list.
 * Members are collaborators — the owner/author is displayed separately in the project header.
 *
 * Pass `$includeOwner=true` in the query to skip this exclusion (e.g. for mention popups).
 */
const excludeProjectOwner = async (context) => {
    const { query } = context.params;
    // Allow callers to opt-out of owner exclusion (e.g. comment mentions)
    if (query?.$includeOwner) {
        delete query.$includeOwner;
        return context;
    }
    const projectId = query?.projectId;
    if (!projectId)
        return context;
    const [project] = await adapters_1.db
        .select({ ownerId: schema_1.projects.ownerId })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
        .limit(1);
    if (project?.ownerId) {
        // If userId is already set (e.g. by searchMembers), merge $ne with existing filters
        if (query.userId && typeof query.userId === 'object') {
            // Already has a filter like { $in: [...] } — also add $ne
            query.userId.$ne = project.ownerId;
        }
        else if (!query.userId) {
            query.userId = { $ne: project.ownerId };
        }
        // If userId is a plain string (exact match), don't override — let it through
    }
    return context;
};
exports.excludeProjectOwner = excludeProjectOwner;
