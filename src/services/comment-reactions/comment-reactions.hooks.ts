import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { setReactionUserId } from './hooks/setReactionUserId';
import { toggleReaction } from './hooks/toggleReaction';
import { resolveProjectFromComment } from './hooks/resolveProjectFromComment';
import { resolveProjectFromReaction } from './hooks/resolveProjectFromReaction';
import { notifyOnReaction } from './hooks/notifyOnReaction';

export const commentReactionsHooks = {
    before: {
        all: [authenticate],
        find: [],
        get: [],
        create: [
            setReactionUserId,
            resolveProjectFromComment,
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            toggleReaction,
        ],
        patch: [],
        remove: [
            resolveProjectFromReaction,
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
        ],
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [notifyOnReaction],
        patch: [],
        remove: [],
    },
};

