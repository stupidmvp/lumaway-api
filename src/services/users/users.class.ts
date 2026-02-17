import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { users } from '../../db/schema';
import { userCreateSchema, userPatchSchema } from './users.schema';

export class UsersService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, users, userCreateSchema, userPatchSchema);
    }
}
