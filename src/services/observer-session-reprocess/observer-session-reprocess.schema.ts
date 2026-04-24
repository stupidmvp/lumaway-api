import { z } from 'zod';

export const observerSessionReprocessSchema = z.object({
    observerSessionId: z.string().uuid(),
});

export type ObserverSessionReprocessInput = z.infer<typeof observerSessionReprocessSchema>;
