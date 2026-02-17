"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsPatchSchema = exports.notificationsCreateSchema = void 0;
const zod_1 = require("zod");
exports.notificationsCreateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    type: zod_1.z.enum([
        'project_invitation',
        'invitation_accepted',
        'mention',
        'comment_reply',
        'correction',
        'comment_resolved',
        'announcement',
    ]),
    title: zod_1.z.string().min(1),
    body: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.notificationsPatchSchema = zod_1.z.object({
    read: zod_1.z.boolean().optional(),
});
