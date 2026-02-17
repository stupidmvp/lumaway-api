"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modulesPatchSchema = exports.modulesCreateSchema = void 0;
const zod_1 = require("zod");
exports.modulesCreateSchema = zod_1.z.object({
    moduleId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1),
    key: zod_1.z.string().min(1),
    status: zod_1.z.enum(['active', 'inactive']).default('active'),
});
exports.modulesPatchSchema = exports.modulesCreateSchema.partial();
