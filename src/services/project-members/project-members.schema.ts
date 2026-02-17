import { z } from 'zod';

export const projectMembersCreateSchema = z.object({
    projectId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
});

export const projectMembersPatchSchema = z.object({
    role: z.enum(['owner', 'editor', 'viewer']),
});


