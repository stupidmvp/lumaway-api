import { drizzleAdapter } from '../../adapters';
import { ActorsService } from './actors.class';
import { actorsHooks } from './actors.hooks';
import { actors } from '../../db/schema';
import { actorsCreateSchema, actorsPatchSchema } from './actors.schema';

export const actorsService = new ActorsService(
    drizzleAdapter,
    actors,
    actorsCreateSchema,
    actorsPatchSchema
);

// Apply hooks
if ((actorsService as any).hooks) {
    (actorsService as any).hooks(actorsHooks);
}

