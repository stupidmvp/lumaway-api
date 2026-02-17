import { drizzleAdapter } from '../../adapters';
import { OrganizationsService } from './organizations.class';

export const organizationsService = new OrganizationsService(drizzleAdapter);
