"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectFromComment = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * For comment patch/remove: resolve the projectId from the comment record
 * and attach it to context so requireProjectAccess('direct') can use it.
 */
const resolveProjectFromComment = async (context) => {
    const commentId = (context.id ?? context.params?.route?.id);
    if (!commentId)
        return context;
    // Only needed if projectId isn't already in context
    if (context.data?.projectId || context.params?.query?.projectId) {
        return context;
    }
    const [comment] = await adapters_1.db
        .select({ projectId: schema_1.comments.projectId })
        .from(schema_1.comments)
        .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))
        .limit(1);
    if (comment) {
        // Inject projectId so requireProjectAccess('direct') can resolve the project
        if (!context.params)
            context.params = {};
        if (!context.params.query)
            context.params.query = {};
        context.params.query.projectId = comment.projectId;
    }
    return context;
};
exports.resolveProjectFromComment = resolveProjectFromComment;
