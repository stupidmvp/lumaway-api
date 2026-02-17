import { z } from 'zod';

export const createVersionSchema = z.object({
    walkthroughId: z.string().uuid(),
    versionNumber: z.number().int().positive(),
    title: z.string(),
    steps: z.array(z.any()),
    isPublished: z.boolean(),
    createdBy: z.string().uuid().optional(),
    restoredFrom: z.string().uuid().optional()
});

export const patchVersionSchema = createVersionSchema.partial();

export const restoreVersionSchema = z.object({
    versionId: z.string().uuid()
});
