import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';

export const observerSessionReviewHooks = {
    before: {
        all: [authenticate],
        find: [requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromObserverSession' })],
    },
};
