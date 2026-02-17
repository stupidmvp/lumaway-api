import { drizzleAdapter } from '../../adapters';
import { RolePermissionsService } from './role-permissions.class';

export const rolePermissionsService = new RolePermissionsService(drizzleAdapter);
