import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { projectMembers } from '../../db/schema';

export class ProjectMembersService extends DrizzleService<typeof projectMembers> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}


