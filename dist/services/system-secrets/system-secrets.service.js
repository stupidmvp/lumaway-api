"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSecretsService = void 0;
const adapters_1 = require("../../adapters");
const system_secrets_class_1 = require("./system-secrets.class");
const system_secrets_hooks_1 = require("./system-secrets.hooks");
const schema_1 = require("../../db/schema");
const system_secrets_schema_1 = require("./system-secrets.schema");
exports.systemSecretsService = new system_secrets_class_1.SystemSecretsService(adapters_1.drizzleAdapter, schema_1.systemSecrets, system_secrets_schema_1.systemSecretsCreateSchema, system_secrets_schema_1.systemSecretsPatchSchema);
// Apply hooks
if (exports.systemSecretsService.hooks) {
    exports.systemSecretsService.hooks(system_secrets_hooks_1.systemSecretsHooks);
}
