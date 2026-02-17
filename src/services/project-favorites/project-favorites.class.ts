import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { projectFavorites } from '../../db/schema';

export class ProjectFavoritesService extends DrizzleService<typeof projectFavorites> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}

