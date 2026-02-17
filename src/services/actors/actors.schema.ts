import { z } from 'zod';
import { actors } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const actorsSchema = createSelectSchema(actors);

export const actorsCreateSchema = createInsertSchema(actors, {
    projectId: z.string().uuid(),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must be lowercase alphanumeric with hyphens (e.g., "sales-rep")',
    }),
    description: z.string().max(500).optional(),
    color: z.string().max(20).optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const actorsPatchSchema = actorsCreateSchema.partial().omit({
    projectId: true, // Should not change project
});

