import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { tenantLlmKeys } from '../../db/schema';

export class TenantLlmKeysService extends DrizzleService<typeof tenantLlmKeys> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
