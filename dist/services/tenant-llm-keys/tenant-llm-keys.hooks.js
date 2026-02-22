"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantLlmKeysHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const encryption_1 = require("../../utils/encryption");
/**
 * Hook: Encrypt the apiKey before create/patch.
 * Transforms plain-text `apiKey` into `encryptedApiKey` and removes the plain field.
 */
function encryptKeyBeforeSave(context) {
    const data = context.data;
    if (data?.apiKey) {
        data.encryptedApiKey = (0, encryption_1.encryptApiKey)(data.apiKey);
        delete data.apiKey;
    }
    return context;
}
/**
 * Hook: Redact encryptedApiKey from all responses.
 * Never expose encrypted keys to the client.
 */
function redactEncryptedKey(context) {
    const redact = (item) => {
        if (item?.encryptedApiKey) {
            item.encryptedApiKey = '••••••••';
        }
        return item;
    };
    if (context.result) {
        if (Array.isArray(context.result)) {
            context.result = context.result.map(redact);
        }
        else if (context.result.data && Array.isArray(context.result.data)) {
            context.result.data = context.result.data.map(redact);
        }
        else {
            redact(context.result);
        }
    }
    return context;
}
exports.tenantLlmKeysHooks = {
    before: {
        find: [authenticate_1.authenticate],
        get: [authenticate_1.authenticate],
        create: [authenticate_1.authenticate, encryptKeyBeforeSave],
        patch: [authenticate_1.authenticate, encryptKeyBeforeSave],
        remove: [authenticate_1.authenticate],
    },
    after: {
        find: [redactEncryptedKey],
        get: [redactEncryptedKey],
        create: [redactEncryptedKey],
        patch: [redactEncryptedKey],
    },
};
