"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectFromReaction = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook: resolves the projectId from the comment that the reaction belongs to.
 * This is needed for project access checks on remove operations.
 */
const resolveProjectFromReaction = async (context) => {
    const reactionId = (context.id ?? context.params?.route?.id);
    if (!reactionId)
        return context;
    // Get the reaction to find the commentId
    const [reaction] = await adapters_1.db
        .select({ commentId: schema_1.commentReactions.commentId })
        .from(schema_1.commentReactions)
        .where((0, drizzle_orm_1.eq)(schema_1.commentReactions.id, reactionId))
        .limit(1);
    if (!reaction)
        return context;
    // Get the comment to find the projectId
    const [comment] = await adapters_1.db
        .select({ projectId: schema_1.comments.projectId })
        .from(schema_1.comments)
        .where((0, drizzle_orm_1.eq)(schema_1.comments.id, reaction.commentId))
        .limit(1);
    if (comment) {
        // Inject projectId for the requireProjectAccess hook
        if (!context.params.query)
            context.params.query = {};
        context.params.query.projectId = comment.projectId;
        if (!context.data)
            context.data = {};
        context.data.projectId = comment.projectId;
    }
    return context;
};
exports.resolveProjectFromReaction = resolveProjectFromReaction;
