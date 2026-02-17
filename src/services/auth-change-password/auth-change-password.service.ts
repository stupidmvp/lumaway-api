import { drizzleAdapter } from '../../adapters';
import { AuthChangePasswordService } from './auth-change-password.class';
import { authChangePasswordHooks } from './auth-change-password.hooks';

export const authChangePasswordService = new AuthChangePasswordService(drizzleAdapter);
(authChangePasswordService as any).hooks(authChangePasswordHooks);

