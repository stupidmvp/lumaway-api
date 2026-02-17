import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { roles } from '../../db/schema';
import { rolesCreateSchema, rolesPatchSchema } from './roles.schema';
import { z } from 'zod';

export class RolesService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, roles, rolesCreateSchema, rolesPatchSchema);
    }
}
