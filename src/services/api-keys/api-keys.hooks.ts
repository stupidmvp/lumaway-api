import { authenticate } from '../../hooks/authenticate';
import { generateKey } from './hooks/generateKey';
import { populateProject } from './hooks/populateProject';

export const apiKeysHooks = {
    before: {
        create: [authenticate, generateKey],
        update: [authenticate],
        patch: [authenticate],
        remove: [authenticate]
    },
    after: {
        all: [populateProject]
    }
};
