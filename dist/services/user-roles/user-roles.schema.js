"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRolesPatchSchema = exports.userRolesCreateSchema = void 0;
const zod_1 = require("zod");
exports.userRolesCreateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    roleId: zod_1.z.string().uuid(),
});
exports.userRolesPatchSchema = exports.userRolesCreateSchema.partial();
