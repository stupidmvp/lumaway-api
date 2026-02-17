import { z } from 'zod';

// .passthrough() preserves fields injected by hooks (token, invitedBy, expiresAt)
// without allowing the frontend to bypass validation on the declared fields.
// prepareInvitation hook always overwrites token/invitedBy/expiresAt, so no security risk.
export const projectInvitationsCreateSchema = z.object({
    projectId: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
}).passthrough();

export const projectInvitationsPatchSchema = z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
    role: z.enum(['owner', 'editor', 'viewer']).optional(),
}).passthrough();

