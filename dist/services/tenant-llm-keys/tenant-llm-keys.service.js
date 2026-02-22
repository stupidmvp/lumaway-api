"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantLlmKeysService = void 0;
const adapters_1 = require("../../adapters");
const tenant_llm_keys_class_1 = require("./tenant-llm-keys.class");
const tenant_llm_keys_hooks_1 = require("./tenant-llm-keys.hooks");
const schema_1 = require("../../db/schema");
const tenant_llm_keys_schema_1 = require("./tenant-llm-keys.schema");
exports.tenantLlmKeysService = new tenant_llm_keys_class_1.TenantLlmKeysService(adapters_1.drizzleAdapter, schema_1.tenantLlmKeys, tenant_llm_keys_schema_1.tenantLlmKeysCreateSchema, tenant_llm_keys_schema_1.tenantLlmKeysPatchSchema);
// Apply hooks
if (exports.tenantLlmKeysService.hooks) {
    exports.tenantLlmKeysService.hooks(tenant_llm_keys_hooks_1.tenantLlmKeysHooks);
}
