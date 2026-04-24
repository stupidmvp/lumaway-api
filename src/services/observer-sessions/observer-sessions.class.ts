import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { observerSessions } from '../../db/schema';

export class ObserverSessionsService extends DrizzleService<typeof observerSessions> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
