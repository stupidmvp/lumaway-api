import { z } from 'zod';

export const rolesCreateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const rolesPatchSchema = rolesCreateSchema.partial();
