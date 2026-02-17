import { z } from 'zod';
import { walkthroughs } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const walkthroughsSchema = createSelectSchema(walkthroughs);

export const stepSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    content: z.string(),
    target: z.string().optional(),
    placement: z.enum([
        'auto',
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
        'right', 'right-start', 'right-end',
    ]).default('auto'),
});

export const walkthroughsCreateSchema = createInsertSchema(walkthroughs, {
    projectId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().max(2000).optional().nullable(),
    content: z.any().optional().nullable(), // Lexical editor state JSON
    steps: z.array(stepSchema).optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).optional(),
    isPublished: z.boolean().optional(),
}).omit({
    createdAt: true,
    updatedAt: true,
});

export const walkthroughsPatchSchema = walkthroughsCreateSchema.partial().omit({
    projectId: true, // Should not change project
});
