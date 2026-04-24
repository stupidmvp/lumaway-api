import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';

export const observerSessionEventsHooks = {
    before: {
        all: [authenticate],
        create: [requireProjectAccess({ minRole: 'editor', resolveProject: 'fromObserverSession' })],
    },
};
