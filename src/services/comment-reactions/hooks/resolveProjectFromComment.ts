import { db } from '../../../adapters';
import { comments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook on create: resolves projectId from the commentId in the reaction data.
 * This is needed for project access checks.
 */
export const resolveProjectFromComment = async (context: any) => {
    const commentId = context.data?.commentId;
    if (!commentId) return context;

    const [comment] = await db
        .select({ projectId: comments.projectId })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

    if (comment) {
        // Inject projectId for the requireProjectAccess hook
        if (!context.params.query) context.params.query = {};
        context.params.query.projectId = comment.projectId;
        context.data.projectId = comment.projectId;
    }

    return context;
};

