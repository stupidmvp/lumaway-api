import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { walkthroughs } from '../../db/schema';

export class WalkthroughsService extends DrizzleService<typeof walkthroughs> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
