import { drizzleAdapter } from '../../adapters';
import { observerSessions } from '../../db/schema';
import { ObserverSessionsService } from './observer-sessions.class';
import { observerSessionsCreateSchema, observerSessionsPatchSchema } from './observer-sessions.schema';
import { observerSessionsHooks } from './observer-sessions.hooks';

export const observerSessionsService = new ObserverSessionsService(
    drizzleAdapter,
    observerSessions,
    observerSessionsCreateSchema,
    observerSessionsPatchSchema
);

if ((observerSessionsService as any).hooks) {
    (observerSessionsService as any).hooks(observerSessionsHooks);
}
