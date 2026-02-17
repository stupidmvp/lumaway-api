import { drizzleAdapter } from '../../adapters';
import { ModulesService } from './modules.class';

export const modulesService = new ModulesService(drizzleAdapter);
