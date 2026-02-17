import { authenticate } from '../../hooks/authenticate';
import { getUserProfile } from './hooks/getUserProfile';

export const userProfilesHooks = {
    before: {
        all: [authenticate],
        get: [getUserProfile],
    },
};

