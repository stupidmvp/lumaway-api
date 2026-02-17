import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { captureStateBeforeUpdate, createVersionAfterUpdate } from './hooks/createVersionOnUpdate';
import { populateWalkthroughRelations } from './hooks/populateWalkthroughRelations';
import { filterByMembership } from './hooks/filterByMembership';
import { filterByTags } from './hooks/filterByTags';
import { filterByActorId } from './hooks/filterByActorId';
import { searchWalkthroughs } from './hooks/searchWalkthroughs';
import { castQuery } from '../../hooks/castQuery';

export const walkthroughsHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({ booleans: ['isPublished'] }),
            searchWalkthroughs,
            filterByTags,
            filterByActorId,
            filterByMembership,
        ],
        create: [
            // Editors+ can create walkthroughs — projectId is in context.data
            requireProjectAccess({ minRole: 'editor', resolveProject: 'direct' }),
        ],
        update: [
            // context.id IS the walkthrough — resolve project from it
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthroughSelf' }),
            captureStateBeforeUpdate(),
        ],
        patch: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthroughSelf' }),
            captureStateBeforeUpdate(),
        ],
        remove: [
            // Only owners can delete walkthroughs
            requireProjectAccess({ minRole: 'owner', resolveProject: 'fromWalkthroughSelf' }),
        ]
    },
    after: {
        all: [populateWalkthroughRelations],
        create: [],
        update: [createVersionAfterUpdate()],
        patch: [createVersionAfterUpdate()],
        remove: []
    }
};
