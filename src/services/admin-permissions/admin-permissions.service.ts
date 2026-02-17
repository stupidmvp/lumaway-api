import { drizzleAdapter } from '../../adapters';
import { AdminPermissionsService } from './admin-permissions.class';
import { adminPermissionsHooks } from './admin-permissions.hooks';

export const adminPermissionsService = new AdminPermissionsService(drizzleAdapter);
adminPermissionsService.hooks(adminPermissionsHooks);
