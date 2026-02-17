import { drizzleAdapter } from '../../adapters';
import { UserOrganizationsService } from './user-organizations.class';
import { userOrganizationsHooks } from './user-organizations.hooks';

export const userOrganizationsService = new UserOrganizationsService(drizzleAdapter);
userOrganizationsService.hooks(userOrganizationsHooks);
