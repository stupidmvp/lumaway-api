import { drizzleAdapter } from '../../adapters';
import { AuthResetPasswordService } from './auth-reset-password.class';
import { authResetPasswordHooks } from './auth-reset-password.hooks';

export const authResetPasswordService = new AuthResetPasswordService(drizzleAdapter);
(authResetPasswordService as any).hooks(authResetPasswordHooks);

