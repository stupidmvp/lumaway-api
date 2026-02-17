import { z } from 'zod';

const attachmentSchema = z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1),
    fileSize: z.number().int().positive(),
    s3Key: z.string().min(1),
});

// .passthrough() preserves userId injected by setCommentUserId hook
export const commentsCreateSchema = z.object({
    projectId: z.string().uuid(),
    targetType: z.enum(['project', 'walkthrough', 'walkthrough_step']).default('project'),
    targetId: z.string().optional(),
    stepId: z.string().optional(),
    content: z.string().min(1),
    type: z.enum(['comment', 'correction', 'announcement']).default('comment'),
    parentId: z.string().uuid().optional(),
    attachments: z.array(attachmentSchema).optional(),
}).passthrough();

export const commentsPatchSchema = z.object({
    content: z.string().min(1).optional(),
    status: z.enum(['active', 'archived', 'deleted']).optional(),
    isResolved: z.boolean().optional(),
    removeAttachmentIds: z.array(z.string().uuid()).optional(),
}).passthrough();
