import { drizzleAdapter } from '../../adapters';
import { AdminUsersService } from './admin-users.class';
import { adminUsersHooks } from './admin-users.hooks';

export const adminUsersService = new AdminUsersService(drizzleAdapter);
adminUsersService.hooks(adminUsersHooks);
