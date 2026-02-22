import { z } from 'zod';
import { tenantLlmKeys } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const tenantLlmKeysSchema = createSelectSchema(tenantLlmKeys);

export const tenantLlmKeysCreateSchema = z.object({
    organizationId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    provider: z.enum(['google', 'groq', 'openai', 'anthropic']),
    modelId: z.string().max(100),
    apiKey: z.string().min(1), // Plain text — will be encrypted before storage
}).refine(
    (data) => (data.organizationId && !data.projectId) || (!data.organizationId && data.projectId),
    { message: 'Exactly one of organizationId or projectId must be provided' }
);

export const tenantLlmKeysPatchSchema = z.object({
    modelId: z.string().max(100).optional(),
    apiKey: z.string().min(1).optional(), // Plain text — will be encrypted before storage
    isActive: z.boolean().optional(),
});

export type TenantLlmKey = z.infer<typeof tenantLlmKeysSchema>;
export type TenantLlmKeyCreate = z.infer<typeof tenantLlmKeysCreateSchema>;
export type TenantLlmKeyPatch = z.infer<typeof tenantLlmKeysPatchSchema>;
