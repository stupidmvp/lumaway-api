import { authenticate } from '../../hooks/authenticate';
import { completeOnboarding } from './hooks/completeOnboarding';

export const authOnboardingHooks = {
    before: {
        all: [authenticate],
        create: [completeOnboarding],
    },
};
