import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { userRoles } from '../../db/schema';
import { userRolesCreateSchema, userRolesPatchSchema } from './user-roles.schema';

export class UserRolesService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, userRoles, userRolesCreateSchema, userRolesPatchSchema);
    }
}
