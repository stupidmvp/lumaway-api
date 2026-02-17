"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysService = void 0;
const adapters_1 = require("../../adapters");
const api_keys_class_1 = require("./api-keys.class");
const api_keys_hooks_1 = require("./api-keys.hooks");
const schema_1 = require("../../db/schema");
const api_keys_schema_1 = require("./api-keys.schema");
exports.apiKeysService = new api_keys_class_1.ApiKeysService(adapters_1.drizzleAdapter, schema_1.apiKeys, api_keys_schema_1.apiKeysCreateSchema, api_keys_schema_1.apiKeysPatchSchema);
// Apply hooks
if (exports.apiKeysService.hooks) {
    exports.apiKeysService.hooks(api_keys_hooks_1.apiKeysHooks);
}
