import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { setCreateDefaults } from './hooks/setCreateDefaults';

export const observerSessionsHooks = {
    before: {
        all: [authenticate],
        find: [requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' })],
        get: [requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromObserverSessionSelf' })],
        create: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'direct' }),
            setCreateDefaults,
        ],
        update: [requireProjectAccess({ minRole: 'editor', resolveProject: 'fromObserverSessionSelf' })],
        patch: [requireProjectAccess({ minRole: 'editor', resolveProject: 'fromObserverSessionSelf' })],
        remove: [requireProjectAccess({ minRole: 'owner', resolveProject: 'fromObserverSessionSelf' })],
    },
};
