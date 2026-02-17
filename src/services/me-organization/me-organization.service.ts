import { drizzleAdapter } from '../../adapters';
import { MeOrganizationService } from './me-organization.class';
import { meOrganizationHooks } from './me-organization.hooks';

export const meOrganizationService = new MeOrganizationService(drizzleAdapter);
meOrganizationService.hooks(meOrganizationHooks);
