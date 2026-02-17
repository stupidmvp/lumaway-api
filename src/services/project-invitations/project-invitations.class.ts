import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { projectInvitations } from '../../db/schema';

export class ProjectInvitationsService extends DrizzleService<typeof projectInvitations> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}


