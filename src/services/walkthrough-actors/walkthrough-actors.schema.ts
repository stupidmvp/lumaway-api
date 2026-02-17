import { z } from 'zod';
import { walkthroughActors } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const walkthroughActorsSchema = createSelectSchema(walkthroughActors);

export const walkthroughActorsCreateSchema = createInsertSchema(walkthroughActors, {
    walkthroughId: z.string().uuid(),
    actorId: z.string().uuid(),
}).omit({
    createdAt: true,
});

export const walkthroughActorsPatchSchema = walkthroughActorsCreateSchema.partial();

