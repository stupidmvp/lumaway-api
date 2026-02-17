import { z } from 'zod';

export const rolePermissionsCreateSchema = z.object({
    roleId: z.string().uuid(),
    permissionId: z.string().uuid(),
});

export const rolePermissionsPatchSchema = rolePermissionsCreateSchema.partial();
