import { drizzleAdapter } from '../../adapters';
import { PermissionsService } from './permissions.class';

export const permissionsService = new PermissionsService(drizzleAdapter);
