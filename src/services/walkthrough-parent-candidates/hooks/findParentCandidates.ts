import { db } from '../../../adapters';
import { walkthroughs } from '../../../db/schema';
import { eq, and, notInArray, ilike } from 'drizzle-orm';

/**
 * Recursively collects all descendant IDs of a given walkthrough.
 * This prevents circular parent references.
 */
async function collectDescendantIds(walkthroughId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [walkthroughId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = await db
            .select({ id: walkthroughs.id })
            .from(walkthroughs)
            .where(eq(walkthroughs.parentId, currentId));

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
export const findParentCandidates = async (context: any) => {
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
        eq(walkthroughs.projectId, projectId),
        notInArray(walkthroughs.id, excludeIds),
    ];

    if (search && search.trim()) {
        conditions.push(ilike(walkthroughs.title, `%${search.trim()}%`));
    }

    const results = await db
        .select({
            id: walkthroughs.id,
            title: walkthroughs.title,
            isPublished: walkthroughs.isPublished,
            parentId: walkthroughs.parentId,
        })
        .from(walkthroughs)
        .where(and(...conditions))
        .orderBy(walkthroughs.title)
        .limit(limit);

    context.result = {
        data: results,
        total: results.length,
    };

    return context;
};

