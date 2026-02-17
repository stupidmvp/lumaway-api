import { db } from '../../../adapters';
import { commentReactions, comments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook: resolves the projectId from the comment that the reaction belongs to.
 * This is needed for project access checks on remove operations.
 */
export const resolveProjectFromReaction = async (context: any) => {
    const reactionId = (context.id ?? context.params?.route?.id) as string;
    if (!reactionId) return context;

    // Get the reaction to find the commentId
    const [reaction] = await db
        .select({ commentId: commentReactions.commentId })
        .from(commentReactions)
        .where(eq(commentReactions.id, reactionId))
        .limit(1);

    if (!reaction) return context;

    // Get the comment to find the projectId
    const [comment] = await db
        .select({ projectId: comments.projectId })
        .from(comments)
        .where(eq(comments.id, reaction.commentId))
        .limit(1);

    if (comment) {
        // Inject projectId for the requireProjectAccess hook
        if (!context.params.query) context.params.query = {};
        context.params.query.projectId = comment.projectId;
        if (!context.data) context.data = {};
        context.data.projectId = comment.projectId;
    }

    return context;
};

