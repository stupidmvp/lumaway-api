import { drizzleAdapter } from '../../adapters';
import { AuthRegisterService } from './auth-register.class';
import { authRegisterHooks } from './auth-register.hooks';

export const authRegisterService = new AuthRegisterService(drizzleAdapter);
authRegisterService.hooks(authRegisterHooks);
