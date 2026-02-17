"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreVersionSchema = exports.patchVersionSchema = exports.createVersionSchema = void 0;
const zod_1 = require("zod");
exports.createVersionSchema = zod_1.z.object({
    walkthroughId: zod_1.z.string().uuid(),
    versionNumber: zod_1.z.number().int().positive(),
    title: zod_1.z.string(),
    steps: zod_1.z.array(zod_1.z.any()),
    isPublished: zod_1.z.boolean(),
    createdBy: zod_1.z.string().uuid().optional(),
    restoredFrom: zod_1.z.string().uuid().optional()
});
exports.patchVersionSchema = exports.createVersionSchema.partial();
exports.restoreVersionSchema = zod_1.z.object({
    versionId: zod_1.z.string().uuid()
});
