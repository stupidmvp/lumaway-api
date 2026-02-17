"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesPatchSchema = exports.rolesCreateSchema = void 0;
const zod_1 = require("zod");
exports.rolesCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.rolesPatchSchema = exports.rolesCreateSchema.partial();
