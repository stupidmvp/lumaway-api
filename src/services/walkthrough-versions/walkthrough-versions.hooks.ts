import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { populateCreator } from './hooks/populateCreator';

export const walkthroughVersionsHooks = {
    before: {
        all: [authenticate],
        find: [
            // Any project member can view version history
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        get: [],
    },
    after: {
        all: [populateCreator],
    },
    error: {}
};
