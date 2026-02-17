import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { filterActorsByProject } from './hooks/filterActorsByProject';
import { generateSlug } from './hooks/generateSlug';
import { search } from '../../hooks/search';
import { castQuery } from '../../hooks/castQuery';

export const actorsHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({}),
            search({ fields: ['name'] }),
            filterActorsByProject,
        ],
        create: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'direct' }),
            generateSlug,
        ],
        patch: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromActorSelf' }),
            generateSlug,
        ],
        remove: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromActorSelf' }),
        ],
    },
    after: {
        all: [],
    }
};
