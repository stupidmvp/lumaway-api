import { drizzleAdapter } from '../../adapters';
import { RolesService } from './roles.class';

export const rolesService = new RolesService(drizzleAdapter);
