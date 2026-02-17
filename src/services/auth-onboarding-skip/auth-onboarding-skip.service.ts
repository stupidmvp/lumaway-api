import { drizzleAdapter } from '../../adapters';
import { AuthOnboardingSkipService } from './auth-onboarding-skip.class';
import { authOnboardingSkipHooks } from './auth-onboarding-skip.hooks';

export const authOnboardingSkipService = new AuthOnboardingSkipService(drizzleAdapter);
(authOnboardingSkipService as any).hooks(authOnboardingSkipHooks);

