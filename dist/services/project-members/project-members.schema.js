"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectMembersPatchSchema = exports.projectMembersCreateSchema = void 0;
const zod_1 = require("zod");
exports.projectMembersCreateSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    role: zod_1.z.enum(['owner', 'editor', 'viewer']).default('viewer'),
});
exports.projectMembersPatchSchema = zod_1.z.object({
    role: zod_1.z.enum(['owner', 'editor', 'viewer']),
});
