"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectInvitationsPatchSchema = exports.projectInvitationsCreateSchema = void 0;
const zod_1 = require("zod");
// .passthrough() preserves fields injected by hooks (token, invitedBy, expiresAt)
// without allowing the frontend to bypass validation on the declared fields.
// prepareInvitation hook always overwrites token/invitedBy/expiresAt, so no security risk.
exports.projectInvitationsCreateSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['owner', 'editor', 'viewer']).default('viewer'),
}).passthrough();
exports.projectInvitationsPatchSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
    role: zod_1.z.enum(['owner', 'editor', 'viewer']).optional(),
}).passthrough();
