"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsPatchSchema = exports.commentsCreateSchema = void 0;
const zod_1 = require("zod");
const attachmentSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    fileType: zod_1.z.string().min(1),
    fileSize: zod_1.z.number().int().positive(),
    s3Key: zod_1.z.string().min(1),
});
// .passthrough() preserves userId injected by setCommentUserId hook
exports.commentsCreateSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    targetType: zod_1.z.enum(['project', 'walkthrough', 'walkthrough_step']).default('project'),
    targetId: zod_1.z.string().optional(),
    stepId: zod_1.z.string().optional(),
    content: zod_1.z.string().min(1),
    type: zod_1.z.enum(['comment', 'correction', 'announcement']).default('comment'),
    parentId: zod_1.z.string().uuid().optional(),
    attachments: zod_1.z.array(attachmentSchema).optional(),
}).passthrough();
exports.commentsPatchSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['active', 'archived', 'deleted']).optional(),
    isResolved: zod_1.z.boolean().optional(),
    removeAttachmentIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
}).passthrough();
