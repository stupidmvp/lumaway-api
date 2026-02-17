import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { comments } from '../../db/schema';

export class CommentsService extends DrizzleService<typeof comments> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}


