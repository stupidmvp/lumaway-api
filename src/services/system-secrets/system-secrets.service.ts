import { drizzleAdapter } from '../../adapters';
import { SystemSecretsService } from './system-secrets.class';
import { systemSecretsHooks } from './system-secrets.hooks';
import { systemSecrets } from '../../db/schema';
import { systemSecretsCreateSchema, systemSecretsPatchSchema } from './system-secrets.schema';

export const systemSecretsService = new SystemSecretsService(
    drizzleAdapter,
    systemSecrets,
    systemSecretsCreateSchema,
    systemSecretsPatchSchema
);

// Apply hooks
if ((systemSecretsService as any).hooks) {
    (systemSecretsService as any).hooks(systemSecretsHooks);
}
