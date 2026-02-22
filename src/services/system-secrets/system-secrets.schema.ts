import { z } from 'zod';
import { systemSecrets } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const systemSecretsSchema = createSelectSchema(systemSecrets);

export const systemSecretsCreateSchema = createInsertSchema(systemSecrets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const systemSecretsPatchSchema = createInsertSchema(systemSecrets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).partial();

export type SystemSecret = z.infer<typeof systemSecretsSchema>;
export type SystemSecretCreate = z.infer<typeof systemSecretsCreateSchema>;
export type SystemSecretPatch = z.infer<typeof systemSecretsPatchSchema>;
