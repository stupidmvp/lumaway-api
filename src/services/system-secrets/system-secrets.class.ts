import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { systemSecrets } from '../../db/schema';

export class SystemSecretsService extends DrizzleService<typeof systemSecrets> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
