import { z } from 'zod';

export const permissionsCreateSchema = z.object({
    moduleId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
});

export const permissionsPatchSchema = permissionsCreateSchema.partial();
