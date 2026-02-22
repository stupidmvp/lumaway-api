import { drizzleAdapter } from '../../adapters';
import { TenantLlmKeysService } from './tenant-llm-keys.class';
import { tenantLlmKeysHooks } from './tenant-llm-keys.hooks';
import { tenantLlmKeys } from '../../db/schema';
import { tenantLlmKeysCreateSchema, tenantLlmKeysPatchSchema } from './tenant-llm-keys.schema';

export const tenantLlmKeysService = new TenantLlmKeysService(
    drizzleAdapter,
    tenantLlmKeys,
    tenantLlmKeysCreateSchema,
    tenantLlmKeysPatchSchema
);

// Apply hooks
if ((tenantLlmKeysService as any).hooks) {
    (tenantLlmKeysService as any).hooks(tenantLlmKeysHooks);
}
