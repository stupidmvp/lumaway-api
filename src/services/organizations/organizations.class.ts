import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { organizations } from '../../db/schema';
import { organizationsCreateSchema, organizationsPatchSchema } from './organizations.schema';

export class OrganizationsService extends DrizzleService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage, organizations, organizationsCreateSchema, organizationsPatchSchema);
    }
}
