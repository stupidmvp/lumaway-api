import { db } from '../../../adapters';
import { projects } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before find: excludes the project owner (author) from the members list.
 * Members are collaborators — the owner/author is displayed separately in the project header.
 *
 * Pass `$includeOwner=true` in the query to skip this exclusion (e.g. for mention popups).
 */
export const excludeProjectOwner = async (context: any) => {
    const { query } = context.params;

    // Allow callers to opt-out of owner exclusion (e.g. comment mentions)
    if (query?.$includeOwner) {
        delete query.$includeOwner;
        return context;
    }

    const projectId = query?.projectId;

    if (!projectId) return context;

    const [project] = await db
        .select({ ownerId: projects.ownerId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    if (project?.ownerId) {
        // If userId is already set (e.g. by searchMembers), merge $ne with existing filters
        if (query.userId && typeof query.userId === 'object') {
            // Already has a filter like { $in: [...] } — also add $ne
            query.userId.$ne = project.ownerId;
        } else if (!query.userId) {
            query.userId = { $ne: project.ownerId };
        }
        // If userId is a plain string (exact match), don't override — let it through
    }

    return context;
};

