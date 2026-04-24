import { z } from 'zod';

export const observerGenerateWalkthroughSchema = z.object({
    observerSessionId: z.string().uuid(),
    mode: z.enum(['single', 'perChapter']).default('single'),
    baseTitle: z.string().min(1).max(200).optional(),
});

export type ObserverGenerateWalkthroughInput = z.infer<typeof observerGenerateWalkthroughSchema>;
