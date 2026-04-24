import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';

export const observerSessionFinalizeHooks = {
    before: {
        all: [authenticate],
        create: [requireProjectAccess({ minRole: 'editor', resolveProject: 'fromObserverSession' })],
    },
};
