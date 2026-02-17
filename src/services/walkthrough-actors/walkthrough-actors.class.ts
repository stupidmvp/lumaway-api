import { BaseService, DrizzleAdapter } from '@flex-donec/core';
import { db } from '../../adapters';
import { walkthroughActors, actors } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * `walkthrough-actors` service — manages M:N associations between walkthroughs and actors.
 *
 * - find(params) → GET /walkthrough-actors?walkthroughId=xxx  (list actors for a walkthrough)
 * - create(data)  → POST /walkthrough-actors { walkthroughId, actorId }  (assign actor)
 * - remove(id)    → DELETE /walkthrough-actors/:actorId?walkthroughId=xxx  (unassign actor)
 */
export class WalkthroughActorsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    /**
     * List actors assigned to a walkthrough.
     * Requires ?walkthroughId= query param.
     */
    async find(params?: any): Promise<any> {
        // The framework's RouteManager passes context.params.query directly,
        // so `params` here IS the query object itself.
        const walkthroughId = params?.walkthroughId;
        if (!walkthroughId) {
            throw new Error('walkthroughId query parameter is required');
        }

        const results = await db
            .select({
                walkthroughId: walkthroughActors.walkthroughId,
                actorId: walkthroughActors.actorId,
                createdAt: walkthroughActors.createdAt,
                // Join actor details
                actor: {
                    id: actors.id,
                    name: actors.name,
                    slug: actors.slug,
                    description: actors.description,
                    color: actors.color,
                },
            })
            .from(walkthroughActors)
            .innerJoin(actors, eq(walkthroughActors.actorId, actors.id))
            .where(eq(walkthroughActors.walkthroughId, walkthroughId));

        return results;
    }

    /**
     * Assign an actor to a walkthrough.
     */
    async create(data: any, _params?: any): Promise<any> {
        const { walkthroughId, actorId } = data;

        if (!walkthroughId || !actorId) {
            throw new Error('walkthroughId and actorId are required');
        }

        const [result] = await db
            .insert(walkthroughActors)
            .values({ walkthroughId, actorId })
            .onConflictDoNothing()
            .returning();

        return result || { walkthroughId, actorId, alreadyAssigned: true };
    }

    /**
     * Remove an actor from a walkthrough.
     * DELETE /walkthrough-actors/:actorId?walkthroughId=xxx
     */
    async remove(actorId: string, params?: any): Promise<any> {
        const walkthroughId = params?.query?.walkthroughId;
        if (!walkthroughId) {
            throw new Error('walkthroughId query parameter is required');
        }

        await db
            .delete(walkthroughActors)
            .where(
                and(
                    eq(walkthroughActors.walkthroughId, walkthroughId),
                    eq(walkthroughActors.actorId, actorId)
                )
            );

        return { walkthroughId, actorId, removed: true };
    }

    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}

