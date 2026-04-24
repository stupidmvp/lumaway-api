import { z } from 'zod';

export const observerSessionFinalizeSchema = z.object({
    observerSessionId: z.string().uuid(),
    videoS3Key: z.string().max(1000).optional().nullable(),
    videoDurationMs: z.number().int().min(0).optional().nullable(),
    endedAt: z.coerce.date().optional(),
});

export type ObserverSessionFinalizeInput = z.infer<typeof observerSessionFinalizeSchema>;
