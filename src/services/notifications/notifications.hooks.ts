import { authenticate } from '../../hooks/authenticate';
import { restrictToOwner } from './hooks/restrictToOwner';
import { castQuery } from '../../hooks/castQuery';

export const notificationsHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({ booleans: ['read'] }),
            restrictToOwner,
        ],
        get: [],
        create: [], // Created internally by the system, not by users
        patch: [restrictToOwner],
        remove: [restrictToOwner],
    },
    after: {},
};


