"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3UrlSigningSchema = void 0;
const zod_1 = require("zod");
exports.s3UrlSigningSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    path: zod_1.z.string().min(1).optional(),
    filename: zod_1.z.string().min(1),
    bucket: zod_1.z.string().min(1).optional(),
});
