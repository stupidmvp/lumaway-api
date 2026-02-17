import { drizzleAdapter } from '../../adapters';
import { ApiKeysService } from './api-keys.class';
import { apiKeysHooks } from './api-keys.hooks';
import { apiKeys } from '../../db/schema';
import { apiKeysCreateSchema, apiKeysPatchSchema } from './api-keys.schema';

export const apiKeysService = new ApiKeysService(drizzleAdapter, apiKeys, apiKeysCreateSchema, apiKeysPatchSchema);

// Apply hooks
if ((apiKeysService as any).hooks) {
    (apiKeysService as any).hooks(apiKeysHooks);
}
