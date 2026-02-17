import { db } from '../../../adapters';
import { commentReactions } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Before hook on create: implements toggle behavior.
 * If the user already reacted with the same emoji on the same comment,
 * remove the existing reaction and skip the create.
 * Otherwise, proceed with creating the reaction.
 */
export const toggleReaction = async (context: any) => {
    const { commentId, emoji, userId } = context.data;

    if (!commentId || !emoji || !userId) return context;

    // Check for existing reaction
    const [existing] = await db
        .select()
        .from(commentReactions)
        .where(
            and(
                eq(commentReactions.commentId, commentId),
                eq(commentReactions.userId, userId),
                eq(commentReactions.emoji, emoji)
            )
        )
        .limit(1);

    if (existing) {
        // Remove the existing reaction
        await db
            .delete(commentReactions)
            .where(eq(commentReactions.id, existing.id));

        // Skip the actual create — return the removed reaction with a toggle flag
        context.result = { ...existing, _toggled: 'removed' };
    }

    return context;
};

