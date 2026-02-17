import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { walkthroughVersions } from '../../db/schema';

export class WalkthroughVersionsService extends DrizzleService<typeof walkthroughVersions> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
