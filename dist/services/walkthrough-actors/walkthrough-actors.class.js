"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkthroughActorsService = void 0;
const core_1 = require("@flex-donec/core");
const adapters_1 = require("../../adapters");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * `walkthrough-actors` service — manages M:N associations between walkthroughs and actors.
 *
 * - find(params) → GET /walkthrough-actors?walkthroughId=xxx  (list actors for a walkthrough)
 * - create(data)  → POST /walkthrough-actors { walkthroughId, actorId }  (assign actor)
 * - remove(id)    → DELETE /walkthrough-actors/:actorId?walkthroughId=xxx  (unassign actor)
 */
class WalkthroughActorsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    /**
     * List actors assigned to a walkthrough.
     * Requires ?walkthroughId= query param.
     */
    async find(params) {
        // The framework's RouteManager passes context.params.query directly,
        // so `params` here IS the query object itself.
        const walkthroughId = params?.walkthroughId;
        if (!walkthroughId) {
            throw new Error('walkthroughId query parameter is required');
        }
        const results = await adapters_1.db
            .select({
            walkthroughId: schema_1.walkthroughActors.walkthroughId,
            actorId: schema_1.walkthroughActors.actorId,
            createdAt: schema_1.walkthroughActors.createdAt,
            // Join actor details
            actor: {
                id: schema_1.actors.id,
                name: schema_1.actors.name,
                slug: schema_1.actors.slug,
                description: schema_1.actors.description,
                color: schema_1.actors.color,
            },
        })
            .from(schema_1.walkthroughActors)
            .innerJoin(schema_1.actors, (0, drizzle_orm_1.eq)(schema_1.walkthroughActors.actorId, schema_1.actors.id))
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughActors.walkthroughId, walkthroughId));
        return results;
    }
    /**
     * Assign an actor to a walkthrough.
     */
    async create(data, _params) {
        const { walkthroughId, actorId } = data;
        if (!walkthroughId || !actorId) {
            throw new Error('walkthroughId and actorId are required');
        }
        const [result] = await adapters_1.db
            .insert(schema_1.walkthroughActors)
            .values({ walkthroughId, actorId })
            .onConflictDoNothing()
            .returning();
        return result || { walkthroughId, actorId, alreadyAssigned: true };
    }
    /**
     * Remove an actor from a walkthrough.
     * DELETE /walkthrough-actors/:actorId?walkthroughId=xxx
     */
    async remove(actorId, params) {
        const walkthroughId = params?.query?.walkthroughId;
        if (!walkthroughId) {
            throw new Error('walkthroughId query parameter is required');
        }
        await adapters_1.db
            .delete(schema_1.walkthroughActors)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughActors.walkthroughId, walkthroughId), (0, drizzle_orm_1.eq)(schema_1.walkthroughActors.actorId, actorId)));
        return { walkthroughId, actorId, removed: true };
    }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
}
exports.WalkthroughActorsService = WalkthroughActorsService;
