import { z } from 'zod';

export const createVersionSchema = z.object({
    walkthroughId: z.string().uuid(),
    versionNumber: z.number().int().positive(),
    title: z.string(),
    steps: z.array(z.any()),
    status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'published']).default('draft'),
    isPublished: z.boolean().default(false),
    requestedApprovalAt: z.string().datetime().optional().nullable(),
    approvedAt: z.string().datetime().optional().nullable(),
    approvedBy: z.string().uuid().optional().nullable(),
    rejectionReason: z.string().optional().nullable(),
    createdBy: z.string().uuid().optional(),
    restoredFrom: z.string().uuid().optional()
});

export const patchVersionSchema = createVersionSchema.partial();

export const restoreVersionSchema = z.object({
    versionId: z.string().uuid()
});
