import { drizzleAdapter } from '../../adapters';
import { AuthOnboardingService } from './auth-onboarding.class';
import { authOnboardingHooks } from './auth-onboarding.hooks';

export const authOnboardingService = new AuthOnboardingService(drizzleAdapter);
(authOnboardingService as any).hooks(authOnboardingHooks);

