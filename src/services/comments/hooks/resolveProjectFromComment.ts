import { db } from '../../../adapters';
import { comments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * For comment patch/remove: resolve the projectId from the comment record
 * and attach it to context so requireProjectAccess('direct') can use it.
 */
export const resolveProjectFromComment = async (context: any) => {
    const commentId = (context.id ?? context.params?.route?.id) as string;
    if (!commentId) return context;

    // Only needed if projectId isn't already in context
    if (context.data?.projectId || context.params?.query?.projectId) {
        return context;
    }

    const [comment] = await db
        .select({ projectId: comments.projectId })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

    if (comment) {
        // Inject projectId so requireProjectAccess('direct') can resolve the project
        if (!context.params) context.params = {};
        if (!context.params.query) context.params.query = {};
        context.params.query.projectId = comment.projectId;
    }

    return context;
};


