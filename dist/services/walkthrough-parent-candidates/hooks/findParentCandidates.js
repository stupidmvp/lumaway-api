"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findParentCandidates = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Recursively collects all descendant IDs of a given walkthrough.
 * This prevents circular parent references.
 */
async function collectDescendantIds(walkthroughId) {
    const descendants = [];
    const queue = [walkthroughId];
    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.parentId, currentId));
        for (const child of children) {
            descendants.push(child.id);
            queue.push(child.id);
        }
    }
    return descendants;
}
/**
 * Before hook for `find` on `walkthrough-parent-candidates`.
 *
 * Returns walkthroughs from the same project that can be valid parents,
 * excluding the walkthrough itself and all its descendants.
 *
 * Query params:
 *   - walkthroughId (required): the walkthrough being edited
 *   - projectId (required): the project to search in
 *   - search (optional): filter by title
 *   - $limit (optional): max results (default 10)
 */
const findParentCandidates = async (context) => {
    const { walkthroughId, projectId, search, $limit } = context.params?.query || {};
    if (!walkthroughId || !projectId) {
        context.result = { data: [], total: 0 };
        return context;
    }
    const limit = Math.min(Number($limit) || 10, 50);
    // Collect IDs to exclude: the walkthrough itself + all descendants
    const descendantIds = await collectDescendantIds(walkthroughId);
    const excludeIds = [walkthroughId, ...descendantIds];
    // Build conditions
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, projectId),
        (0, drizzle_orm_1.notInArray)(schema_1.walkthroughs.id, excludeIds),
    ];
    if (search && search.trim()) {
        conditions.push((0, drizzle_orm_1.ilike)(schema_1.walkthroughs.title, `%${search.trim()}%`));
    }
    const results = await adapters_1.db
        .select({
        id: schema_1.walkthroughs.id,
        title: schema_1.walkthroughs.title,
        isPublished: schema_1.walkthroughs.isPublished,
        parentId: schema_1.walkthroughs.parentId,
    })
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.and)(...conditions))
        .orderBy(schema_1.walkthroughs.title)
        .limit(limit);
    context.result = {
        data: results,
        total: results.length,
    };
    return context;
};
exports.findParentCandidates = findParentCandidates;
