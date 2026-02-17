import { z } from 'zod';

export const s3UrlSigningSchema = z.object({
    type: z.string().min(1),
    path: z.string().min(1).optional(),
    filename: z.string().min(1),
    bucket: z.string().min(1).optional(),
});
