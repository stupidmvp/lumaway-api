import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { permissions } from '../../db/schema';
import { permissionsCreateSchema, permissionsPatchSchema } from './permissions.schema';

export class PermissionsService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, permissions, permissionsCreateSchema, permissionsPatchSchema);
    }
}
