"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectFromComment = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook on create: resolves projectId from the commentId in the reaction data.
 * This is needed for project access checks.
 */
const resolveProjectFromComment = async (context) => {
    const commentId = context.data?.commentId;
    if (!commentId)
        return context;
    const [comment] = await adapters_1.db
        .select({ projectId: schema_1.comments.projectId })
        .from(schema_1.comments)
        .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))
        .limit(1);
    if (comment) {
        // Inject projectId for the requireProjectAccess hook
        if (!context.params.query)
            context.params.query = {};
        context.params.query.projectId = comment.projectId;
        context.data.projectId = comment.projectId;
    }
    return context;
};
exports.resolveProjectFromComment = resolveProjectFromComment;
