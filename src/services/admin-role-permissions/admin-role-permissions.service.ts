import { drizzleAdapter } from '../../adapters';
import { AdminRolePermissionsService } from './admin-role-permissions.class';
import { adminRolePermissionsHooks } from './admin-role-permissions.hooks';

export const adminRolePermissionsService = new AdminRolePermissionsService(drizzleAdapter);
adminRolePermissionsService.hooks(adminRolePermissionsHooks);
