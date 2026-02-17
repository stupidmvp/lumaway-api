import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { rolePermissions } from '../../db/schema';
import { rolePermissionsCreateSchema, rolePermissionsPatchSchema } from './role-permissions.schema';

export class RolePermissionsService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, rolePermissions, rolePermissionsCreateSchema, rolePermissionsPatchSchema);
    }
}
