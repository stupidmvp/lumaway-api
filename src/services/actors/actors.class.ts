import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { actors } from '../../db/schema';

export class ActorsService extends DrizzleService<typeof actors> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}

