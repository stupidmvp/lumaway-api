import { authenticate } from '../../hooks/authenticate';

/**
 * Hook: Redact encryptedApiKey from all responses.
 * Never expose encrypted keys to the client.
 */
function redactEncryptedKey(context: any) {
    const redact = (item: any) => {
        if (item?.encryptedApiKey) {
            item.encryptedApiKey = '••••••••';
        }
        return item;
    };

    if (context.result) {
        if (Array.isArray(context.result)) {
            context.result = context.result.map(redact);
        } else if (context.result.data && Array.isArray(context.result.data)) {
            context.result.data = context.result.data.map(redact);
        } else {
            redact(context.result);
        }
    }
    return context;
}

export const tenantLlmKeysHooks = {
    before: {
        find: [authenticate],
        get: [authenticate],
        create: [authenticate],
        patch: [authenticate],
        remove: [authenticate],
    },
    after: {
        find: [redactEncryptedKey],
        get: [redactEncryptedKey],
        create: [redactEncryptedKey],
        patch: [redactEncryptedKey],
    },
};
