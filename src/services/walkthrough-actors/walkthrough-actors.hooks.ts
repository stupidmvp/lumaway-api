import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';

export const walkthroughActorsHooks = {
    before: {
        all: [authenticate],
        find: [
            // Requires walkthroughId in query — access is checked via walkthrough's project
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        create: [
            // Assigning actors requires editor access
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
        ],
        remove: [
            // Removing actors requires editor access
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
        ],
    },
    after: {
        all: [],
    }
};

