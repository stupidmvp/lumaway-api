import { db } from '../../../adapters';
import { apiKeys, walkthroughs, walkthroughActors, actors } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Before hook for `find` on `client-walkthroughs`.
 *
 * Public API-key-authenticated endpoint for fetching published walkthroughs.
 * Requires `x-api-key` header.
 * Optionally filters by `x-actor-slug` header to return only walkthroughs
 * assigned to a specific actor (host role).
 *
 * Behavior:
 * - No `x-actor-slug` header → returns ALL published walkthroughs (backward-compatible)
 * - With `x-actor-slug` header → returns walkthroughs that either:
 *   a) Have the matching actor assigned, OR
 *   b) Have NO actors assigned (available to everyone)
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findPublishedWalkthroughs = async (context: any) => {
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;
    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    // Validate API Key and get projectId
    const keyRecords = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];

    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;
    const actorSlug = context.params?.headers?.['x-actor-slug'] as string | undefined;

    // Fetch only published walkthroughs for this project
    const allPublished = await db.select()
        .from(walkthroughs)
        .where(
            and(
                eq(walkthroughs.projectId, projectId),
                eq(walkthroughs.isPublished, true)
            )
        );

    // If no actor slug provided, return all published (backward-compatible)
    if (!actorSlug) {
        context.result = allPublished;
        return context;
    }

    // Find the actor by slug in this project
    const [actor] = await db.select({ id: actors.id })
        .from(actors)
        .where(
            and(
                eq(actors.projectId, projectId),
                eq(actors.slug, actorSlug)
            )
        )
        .limit(1);

    if (!actor) {
        // Unknown actor slug — return only walkthroughs with no actors assigned (universal)
        const walkthroughIds = allPublished.map(w => w.id);
        if (walkthroughIds.length === 0) {
            context.result = [];
            return context;
        }

        const assignedWalkthroughIds = await db
            .select({ walkthroughId: walkthroughActors.walkthroughId })
            .from(walkthroughActors)
            .where(inArray(walkthroughActors.walkthroughId, walkthroughIds));

        const assignedSet = new Set(assignedWalkthroughIds.map(r => r.walkthroughId));
        context.result = allPublished.filter(w => !assignedSet.has(w.id));
        return context;
    }

    // Get walkthrough IDs assigned to this actor
    const actorAssignments = await db
        .select({ walkthroughId: walkthroughActors.walkthroughId })
        .from(walkthroughActors)
        .where(eq(walkthroughActors.actorId, actor.id));

    const actorWalkthroughIds = new Set(actorAssignments.map(a => a.walkthroughId));

    // Get ALL assignments to determine which walkthroughs have no actors (universal)
    const publishedIds = allPublished.map(w => w.id);
    if (publishedIds.length === 0) {
        context.result = [];
        return context;
    }

    const allAssignments = await db
        .select({ walkthroughId: walkthroughActors.walkthroughId })
        .from(walkthroughActors)
        .where(inArray(walkthroughActors.walkthroughId, publishedIds));

    const assignedSet = new Set(allAssignments.map(r => r.walkthroughId));

    // Return walkthroughs that:
    // 1. Are explicitly assigned to this actor, OR
    // 2. Have no actors assigned at all (universal walkthroughs)
    context.result = allPublished.filter(w =>
        actorWalkthroughIds.has(w.id) || !assignedSet.has(w.id)
    );

    return context;
};

