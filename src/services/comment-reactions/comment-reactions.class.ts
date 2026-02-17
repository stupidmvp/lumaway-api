import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { commentReactions } from '../../db/schema';

export class CommentReactionsService extends DrizzleService<typeof commentReactions> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}

