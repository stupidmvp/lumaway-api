"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreVersionSchema = exports.patchVersionSchema = exports.createVersionSchema = void 0;
const zod_1 = require("zod");
exports.createVersionSchema = zod_1.z.object({
    walkthroughId: zod_1.z.string().uuid(),
    versionNumber: zod_1.z.number().int().positive(),
    title: zod_1.z.string(),
    steps: zod_1.z.array(zod_1.z.any()),
    status: zod_1.z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'published']).default('draft'),
    isPublished: zod_1.z.boolean().default(false),
    requestedApprovalAt: zod_1.z.string().datetime().optional().nullable(),
    approvedAt: zod_1.z.string().datetime().optional().nullable(),
    approvedBy: zod_1.z.string().uuid().optional().nullable(),
    rejectionReason: zod_1.z.string().optional().nullable(),
    createdBy: zod_1.z.string().uuid().optional(),
    restoredFrom: zod_1.z.string().uuid().optional()
});
exports.patchVersionSchema = exports.createVersionSchema.partial();
exports.restoreVersionSchema = zod_1.z.object({
    versionId: zod_1.z.string().uuid()
});
