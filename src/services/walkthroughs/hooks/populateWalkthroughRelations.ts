import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters/index.js';
import { projects, users, walkthroughActors, actors } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const populateWalkthroughRelations = async (context: HookContext) => {
    const { result } = context;

    if (!result) return context;

    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        // Populate project
        if (item.projectId) {
            const [project] = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                    organizationId: projects.organizationId
                })
                .from(projects)
                .where(eq(projects.id, item.projectId));

            if (project) {
                item.project = project;
            }
        }

        // Populate owner (if walkthrough has ownerId field)
        if (item.ownerId) {
            const [owner] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar
                })
                .from(users)
                .where(eq(users.id, item.ownerId));

            if (owner) {
                item.owner = owner;
            }
        }

        // Populate actors (host roles assigned to this walkthrough)
        if (item.id) {
            const actorResults = await db
                .select({
                    id: actors.id,
                    name: actors.name,
                    slug: actors.slug,
                    description: actors.description,
                    color: actors.color,
                })
                .from(walkthroughActors)
                .innerJoin(actors, eq(walkthroughActors.actorId, actors.id))
                .where(eq(walkthroughActors.walkthroughId, item.id));

            item.actors = actorResults;
        }
    }

    return context;
};
