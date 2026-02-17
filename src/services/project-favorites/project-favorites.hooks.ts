import { authenticate } from '../../hooks/authenticate';
import { castQuery } from '../../hooks/castQuery';
import { setCurrentUser } from './hooks/setCurrentUser';
import { filterByCurrentUser } from './hooks/filterByCurrentUser';

export const projectFavoritesHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({}),
            filterByCurrentUser,
        ],
        get: [],
        create: [setCurrentUser],
        patch: [],
        remove: [],
    },
    after: {
        all: [],
    },
};

