import { z } from 'zod';

export const organizationsCreateSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    logo: z.string().optional().nullable(),
});

export const organizationsPatchSchema = organizationsCreateSchema.partial();
