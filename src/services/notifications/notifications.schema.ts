import { z } from 'zod';

export const notificationsCreateSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum([
        'project_invitation',
        'invitation_accepted',
        'mention',
        'comment_reply',
        'correction',
        'comment_resolved',
        'announcement',
    ]),
    title: z.string().min(1),
    body: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export const notificationsPatchSchema = z.object({
    read: z.boolean().optional(),
});
