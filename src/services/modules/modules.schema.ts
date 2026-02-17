import { z } from 'zod';

export const modulesCreateSchema = z.object({
    moduleId: z.string().uuid().optional(),
    name: z.string().min(1),
    key: z.string().min(1),
    status: z.enum(['active', 'inactive']).default('active'),
});

export const modulesPatchSchema = modulesCreateSchema.partial();
