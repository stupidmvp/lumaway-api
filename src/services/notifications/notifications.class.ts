import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { notifications } from '../../db/schema';

export class NotificationsService extends DrizzleService<typeof notifications> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }
}


