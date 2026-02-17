import { z } from 'zod';

export const userRolesCreateSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
});

export const userRolesPatchSchema = userRolesCreateSchema.partial();
