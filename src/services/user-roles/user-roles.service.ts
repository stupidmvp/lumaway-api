import { drizzleAdapter } from '../../adapters';
import { UserRolesService } from './user-roles.class';

export const userRolesService = new UserRolesService(drizzleAdapter);
