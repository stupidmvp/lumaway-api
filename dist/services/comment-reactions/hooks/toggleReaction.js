"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleReaction = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook on create: implements toggle behavior.
 * If the user already reacted with the same emoji on the same comment,
 * remove the existing reaction and skip the create.
 * Otherwise, proceed with creating the reaction.
 */
const toggleReaction = async (context) => {
    const { commentId, emoji, userId } = context.data;
    if (!commentId || !emoji || !userId)
        return context;
    // Check for existing reaction
    const [existing] = await adapters_1.db
        .select()
        .from(schema_1.commentReactions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.commentReactions.commentId, commentId), (0, drizzle_orm_1.eq)(schema_1.commentReactions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.commentReactions.emoji, emoji)))
        .limit(1);
    if (existing) {
        // Remove the existing reaction
        await adapters_1.db
            .delete(schema_1.commentReactions)
            .where((0, drizzle_orm_1.eq)(schema_1.commentReactions.id, existing.id));
        // Skip the actual create — return the removed reaction with a toggle flag
        context.result = { ...existing, _toggled: 'removed' };
    }
    return context;
};
exports.toggleReaction = toggleReaction;
