import { z } from 'zod';
import { observerSessions } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const observerSessionsSchema = createSelectSchema(observerSessions);

export const observerSessionsCreateSchema = createInsertSchema(observerSessions, {
    projectId: z.string().uuid(),
    createdBy: z.string().uuid().optional().nullable(),
    intent: z.string().max(4000).optional().nullable(),
    status: z.enum(['recording', 'uploaded', 'processing', 'ready_for_review', 'failed', 'cancelled']).optional(),
    videoS3Key: z.string().max(1000).optional().nullable(),
    videoDurationMs: z.number().int().min(0).optional().nullable(),
    processingSummary: z.record(z.any()).optional(),
}).omit({
    createdAt: true,
    updatedAt: true,
    startedAt: true,
    endedAt: true,
});

export const observerSessionsPatchSchema = observerSessionsCreateSchema.partial().omit({
    projectId: true,
    createdBy: true,
});
