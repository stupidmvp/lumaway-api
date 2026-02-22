import { authenticate } from '../../hooks/authenticate';
import { authorize } from '../../hooks/authorize';
import { redactKeyValue } from './hooks/redactKeyValue';

// SystemSecrets hooks: Only superadmin should access this service
// Keys are redacted in all responses (after hooks)
export const systemSecretsHooks = {
    before: {
        find: [authenticate, authorize('system_secrets')],
        get: [authenticate, authorize('system_secrets')],
        create: [authenticate, authorize('system_secrets')],
        patch: [authenticate, authorize('system_secrets')],
        remove: [authenticate, authorize('system_secrets')],
    },
    after: {
        find: [redactKeyValue],
        get: [redactKeyValue],
        create: [redactKeyValue],
        patch: [redactKeyValue],
    },
};
