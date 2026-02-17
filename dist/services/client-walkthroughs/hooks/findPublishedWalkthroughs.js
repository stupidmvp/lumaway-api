"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublishedWalkthroughs = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
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
const findPublishedWalkthroughs = async (context) => {
    const apiKey = context.params?.headers?.['x-api-key'];
    if (!apiKey) {
        throw new Error('Missing API Key');
    }
    // Validate API Key and get projectId
    const keyRecords = await adapters_1.db.select().from(schema_1.apiKeys).where((0, drizzle_orm_1.eq)(schema_1.apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }
    const projectId = keyRecord.projectId;
    const actorSlug = context.params?.headers?.['x-actor-slug'];
    // Fetch only published walkthroughs for this project
    const allPublished = await adapters_1.db.select()
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.walkthroughs.isPublished, true)));
    // If no actor slug provided, return all published (backward-compatible)
    if (!actorSlug) {
        context.result = allPublished;
        return context;
    }
    // Find the actor by slug in this project
    const [actor] = await adapters_1.db.select({ id: schema_1.actors.id })
        .from(schema_1.actors)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.actors.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.actors.slug, actorSlug)))
        .limit(1);
    if (!actor) {
        // Unknown actor slug — return only walkthroughs with no actors assigned (universal)
        const walkthroughIds = allPublished.map(w => w.id);
        if (walkthroughIds.length === 0) {
            context.result = [];
            return context;
        }
        const assignedWalkthroughIds = await adapters_1.db
            .select({ walkthroughId: schema_1.walkthroughActors.walkthroughId })
            .from(schema_1.walkthroughActors)
            .where((0, drizzle_orm_1.inArray)(schema_1.walkthroughActors.walkthroughId, walkthroughIds));
        const assignedSet = new Set(assignedWalkthroughIds.map(r => r.walkthroughId));
        context.result = allPublished.filter(w => !assignedSet.has(w.id));
        return context;
    }
    // Get walkthrough IDs assigned to this actor
    const actorAssignments = await adapters_1.db
        .select({ walkthroughId: schema_1.walkthroughActors.walkthroughId })
        .from(schema_1.walkthroughActors)
        .where((0, drizzle_orm_1.eq)(schema_1.walkthroughActors.actorId, actor.id));
    const actorWalkthroughIds = new Set(actorAssignments.map(a => a.walkthroughId));
    // Get ALL assignments to determine which walkthroughs have no actors (universal)
    const publishedIds = allPublished.map(w => w.id);
    if (publishedIds.length === 0) {
        context.result = [];
        return context;
    }
    const allAssignments = await adapters_1.db
        .select({ walkthroughId: schema_1.walkthroughActors.walkthroughId })
        .from(schema_1.walkthroughActors)
        .where((0, drizzle_orm_1.inArray)(schema_1.walkthroughActors.walkthroughId, publishedIds));
    const assignedSet = new Set(allAssignments.map(r => r.walkthroughId));
    // Return walkthroughs that:
    // 1. Are explicitly assigned to this actor, OR
    // 2. Have no actors assigned at all (universal walkthroughs)
    context.result = allPublished.filter(w => actorWalkthroughIds.has(w.id) || !assignedSet.has(w.id));
    return context;
};
exports.findPublishedWalkthroughs = findPublishedWalkthroughs;
