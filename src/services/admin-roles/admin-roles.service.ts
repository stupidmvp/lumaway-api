import { drizzleAdapter } from '../../adapters';
import { AdminRolesService } from './admin-roles.class';
import { adminRolesHooks } from './admin-roles.hooks';

export const adminRolesService = new AdminRolesService(drizzleAdapter);
adminRolesService.hooks(adminRolesHooks);
