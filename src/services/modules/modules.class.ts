import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { modules } from '../../db/schema';
import { modulesCreateSchema, modulesPatchSchema } from './modules.schema';

export class ModulesService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, modules, modulesCreateSchema, modulesPatchSchema);
    }
}
