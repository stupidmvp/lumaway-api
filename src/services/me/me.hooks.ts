import { authenticate } from '../../hooks/authenticate';
import { findCurrentUser } from './hooks/findCurrentUser';
import { patchCurrentUser } from './hooks/patchCurrentUser';

export const meHooks = {
    before: {
        all: [authenticate],
        find: [findCurrentUser],
        patch: [patchCurrentUser],
    },
};
