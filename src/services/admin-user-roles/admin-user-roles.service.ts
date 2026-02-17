import { drizzleAdapter } from '../../adapters';
import { AdminUserRolesService } from './admin-user-roles.class';
import { adminUserRolesHooks } from './admin-user-roles.hooks';

export const adminUserRolesService = new AdminUserRolesService(drizzleAdapter);
adminUserRolesService.hooks(adminUserRolesHooks);
