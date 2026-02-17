import { authenticate } from '../../hooks/authenticate';
import { search } from '../../hooks/search';
import { castQuery } from '../../hooks/castQuery';

export const usersHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({}),
            search({ fields: ['email'] }),
        ],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
    after: {
        all: [],
    },
};


