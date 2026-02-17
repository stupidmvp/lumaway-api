import { authenticate } from '../../hooks/authenticate';
import { skipOnboarding } from './hooks/skipOnboarding';

export const authOnboardingSkipHooks = {
    before: {
        all: [authenticate],
        create: [skipOnboarding],
    },
};
