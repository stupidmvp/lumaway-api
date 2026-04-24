import { z } from 'zod';

export const observerEventItemSchema = z.object({
    type: z.enum(['click', 'input', 'change', 'navigation', 'scroll', 'custom']),
    timestampMs: z.number().int().min(0),
    url: z.string().max(4000).optional().nullable(),
    targetSelector: z.string().max(2000).optional().nullable(),
    label: z.string().max(1000).optional().nullable(),
    payload: z.record(z.any()).optional(),
});

export const observerSessionEventsBatchSchema = z.object({
    observerSessionId: z.string().uuid(),
    events: z.array(observerEventItemSchema).min(1).max(1000),
});

export type ObserverSessionEventsBatchInput = z.infer<typeof observerSessionEventsBatchSchema>;
