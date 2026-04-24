import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';

export const observerGenerateWalkthroughHooks = {
    before: {
        all: [authenticate],
        create: [requireProjectAccess({ minRole: 'editor', resolveProject: 'fromObserverSession' })],
    },
};
