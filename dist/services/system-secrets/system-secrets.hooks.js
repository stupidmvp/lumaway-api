"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSecretsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const authorize_1 = require("../../hooks/authorize");
const redactKeyValue_1 = require("./hooks/redactKeyValue");
// SystemSecrets hooks: Only superadmin should access this service
// Keys are redacted in all responses (after hooks)
exports.systemSecretsHooks = {
    before: {
        find: [authenticate_1.authenticate, (0, authorize_1.authorize)('system_secrets')],
        get: [authenticate_1.authenticate, (0, authorize_1.authorize)('system_secrets')],
        create: [authenticate_1.authenticate, (0, authorize_1.authorize)('system_secrets')],
        patch: [authenticate_1.authenticate, (0, authorize_1.authorize)('system_secrets')],
        remove: [authenticate_1.authenticate, (0, authorize_1.authorize)('system_secrets')],
    },
    after: {
        find: [redactKeyValue_1.redactKeyValue],
        get: [redactKeyValue_1.redactKeyValue],
        create: [redactKeyValue_1.redactKeyValue],
        patch: [redactKeyValue_1.redactKeyValue],
    },
};
