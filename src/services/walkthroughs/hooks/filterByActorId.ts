import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { walkthroughActors } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Extracts `actorId` from the query params and filters walkthroughs
 * that are assigned to that actor via the walkthrough_actors pivot table.
 *
 * Query format:
 *   ?actorId=<uuid>
 *
 * If `actorId` is not present, falls through without changes.
 */
export const filterByActorId = async (context: HookContext) => {
    const query = context.params?.query;
    if (!query) return context;

    const actorId = query.actorId;
    if (!actorId) return context;

    // Remove actorId from the generic query so DrizzleService doesn't
    // try to match it as a plain column equality check.
    delete query.actorId;

    // Find all walkthrough IDs assigned to this actor
    const assignments = await db
        .select({ walkthroughId: walkthroughActors.walkthroughId })
        .from(walkthroughActors)
        .where(eq(walkthroughActors.actorId, actorId));

    const walkthroughIds = assignments.map(a => a.walkthroughId);

    if (walkthroughIds.length === 0) {
        // No walkthroughs assigned to this actor — force empty result
        query.id = '00000000-0000-0000-0000-000000000000';
        return context;
    }

    // Narrow the query to only these walkthroughs
    if (!query.$and) {
        query.$and = [];
    }
    query.$and.push({ id: { $in: walkthroughIds } });

    return context;
};

