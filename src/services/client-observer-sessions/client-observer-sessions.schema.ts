import { z } from 'zod';

const observerEventItemSchema = z.object({
    type: z.enum(['click', 'input', 'change', 'navigation', 'scroll', 'custom']),
    timestampMs: z.number().int().min(0),
    url: z.string().max(4000).optional().nullable(),
    targetSelector: z.string().max(2000).optional().nullable(),
    label: z.string().max(1000).optional().nullable(),
    payload: z.record(z.any()).optional(),
});

export const clientObserverSessionsSchema = z.object({
    action: z.enum(['start', 'events', 'finalize', 'signUpload']),
    intent: z.string().max(4000).optional().nullable(),
    observerSessionId: z.string().uuid().optional(),
    lumenId: z.string().uuid().optional(),
    events: z.array(observerEventItemSchema).min(1).max(1000).optional(),
    videoS3Key: z.string().max(1000).optional().nullable(),
    lumenS3Key: z.string().max(1000).optional().nullable(),
    captureSource: z.enum(['dom', 'webmcp', 'hybrid', 'unknown']).optional().nullable(),
    videoDurationMs: z.number().int().min(0).optional().nullable(),
    filename: z.string().max(255).optional(),
});

export type ClientObserverSessionsInput = z.infer<typeof clientObserverSessionsSchema>;
