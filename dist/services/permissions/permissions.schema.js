"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionsPatchSchema = exports.permissionsCreateSchema = void 0;
const zod_1 = require("zod");
exports.permissionsCreateSchema = zod_1.z.object({
    moduleId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.permissionsPatchSchema = exports.permissionsCreateSchema.partial();
