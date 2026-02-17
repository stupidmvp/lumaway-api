import { populateUserContext } from '../../hooks/populateUserContext';
import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { validateProjectData } from './hooks/validateProjectData';
import { generateApiKey } from './hooks/generateApiKey';
import { populateApiKey } from './hooks/populateApiKey';
import { populateProjectRelations } from './hooks/populateProjectRelations';
import { addCreatorAsMember } from './hooks/addCreatorAsMember';
import { filterProjectsByAccess } from './hooks/filterProjectsByAccess';
import { search } from '../../hooks/search';
import { castQuery } from '../../hooks/castQuery';

export const projectsHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({}),
            filterProjectsByAccess,
            search({ fields: ['name'] })
        ],
        get: [],
        create: [populateUserContext, validateProjectData],
        update: [
            populateUserContext,
            requireProjectAccess({ minRole: 'owner', resolveProject: 'fromId' }),
        ],
        patch: [
            populateUserContext,
            requireProjectAccess({ minRole: 'owner', resolveProject: 'fromId' }),
        ],
        remove: [
            requireProjectAccess({ minRole: 'owner', resolveProject: 'fromId' }),
        ]
    },
    after: {
        all: [populateApiKey, populateProjectRelations],
        create: [generateApiKey, addCreatorAsMember]
    }
};
