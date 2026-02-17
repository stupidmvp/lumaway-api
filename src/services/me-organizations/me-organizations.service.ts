import { drizzleAdapter } from '../../adapters';
import { MeOrganizationsService } from './me-organizations.class';
import { meOrganizationsHooks } from './me-organizations.hooks';

export const meOrganizationsService = new MeOrganizationsService(drizzleAdapter);

meOrganizationsService.hooks(meOrganizationsHooks);
