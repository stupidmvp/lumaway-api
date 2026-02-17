"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughsPatchSchema = exports.walkthroughsCreateSchema = exports.stepSchema = exports.walkthroughsSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
exports.walkthroughsSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.walkthroughs);
exports.stepSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string(),
    target: zod_1.z.string().optional(),
    placement: zod_1.z.enum([
        'auto',
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
        'right', 'right-start', 'right-end',
    ]).default('auto'),
});
exports.walkthroughsCreateSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.walkthroughs, {
    projectId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    steps: zod_1.z.array(exports.stepSchema).optional(),
    isPublished: zod_1.z.boolean().optional(),
}).omit({
    createdAt: true,
    updatedAt: true,
});
exports.walkthroughsPatchSchema = exports.walkthroughsCreateSchema.partial().omit({
    projectId: true, // Should not change project
});
