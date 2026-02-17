import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { projects } from '../../db/schema';

export class ProjectsService extends DrizzleService<typeof projects> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}
