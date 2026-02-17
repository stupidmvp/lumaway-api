"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsPatchSchema = exports.organizationsCreateSchema = void 0;
const zod_1 = require("zod");
exports.organizationsCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    logo: zod_1.z.string().optional().nullable(),
});
exports.organizationsPatchSchema = exports.organizationsCreateSchema.partial();
