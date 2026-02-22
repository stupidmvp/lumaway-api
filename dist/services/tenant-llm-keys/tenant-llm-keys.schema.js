"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantLlmKeysPatchSchema = exports.tenantLlmKeysCreateSchema = exports.tenantLlmKeysSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
exports.tenantLlmKeysSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.tenantLlmKeys);
exports.tenantLlmKeysCreateSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid().optional(),
    projectId: zod_1.z.string().uuid().optional(),
    provider: zod_1.z.enum(['google', 'groq', 'openai', 'anthropic']),
    modelId: zod_1.z.string().max(100),
    apiKey: zod_1.z.string().min(1), // Plain text — will be encrypted before storage
}).refine((data) => (data.organizationId && !data.projectId) || (!data.organizationId && data.projectId), { message: 'Exactly one of organizationId or projectId must be provided' });
exports.tenantLlmKeysPatchSchema = zod_1.z.object({
    modelId: zod_1.z.string().max(100).optional(),
    apiKey: zod_1.z.string().min(1).optional(), // Plain text — will be encrypted before storage
    isActive: zod_1.z.boolean().optional(),
});
