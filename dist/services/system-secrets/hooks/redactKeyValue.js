"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactKeyValue = void 0;
/**
 * Hook: redactKeyValue
 * Redacts the `keyValue` field in system_secrets responses.
 * SuperAdmin can see only the last 4 characters for identification.
 * The full key is NEVER returned via the HTTP API.
 */
const redactKeyValue = async (context) => {
    const redact = (record) => {
        if (record && record.keyValue) {
            const value = record.keyValue;
            record.keyValue = value.length > 4
                ? `${'•'.repeat(value.length - 4)}${value.slice(-4)}`
                : '••••';
        }
        return record;
    };
    const result = context.result;
    if (Array.isArray(result)) {
        result.forEach(redact);
    }
    else if (result?.data && Array.isArray(result.data)) {
        result.data.forEach(redact);
    }
    else if (result) {
        redact(result);
    }
    return context;
};
exports.redactKeyValue = redactKeyValue;
