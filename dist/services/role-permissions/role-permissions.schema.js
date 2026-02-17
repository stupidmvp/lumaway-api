"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissionsPatchSchema = exports.rolePermissionsCreateSchema = void 0;
const zod_1 = require("zod");
exports.rolePermissionsCreateSchema = zod_1.z.object({
    roleId: zod_1.z.string().uuid(),
    permissionId: zod_1.z.string().uuid(),
});
exports.rolePermissionsPatchSchema = exports.rolePermissionsCreateSchema.partial();
