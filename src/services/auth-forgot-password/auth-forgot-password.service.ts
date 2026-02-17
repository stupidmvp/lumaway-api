import { drizzleAdapter } from '../../adapters';
import { AuthForgotPasswordService } from './auth-forgot-password.class';
import { authForgotPasswordHooks } from './auth-forgot-password.hooks';

export const authForgotPasswordService = new AuthForgotPasswordService(drizzleAdapter);
(authForgotPasswordService as any).hooks(authForgotPasswordHooks);

