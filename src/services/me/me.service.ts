import { drizzleAdapter } from '../../adapters';
import { MeService } from './me.class';
import { meHooks } from './me.hooks';

export const meService = new MeService(drizzleAdapter);
meService.hooks(meHooks);
