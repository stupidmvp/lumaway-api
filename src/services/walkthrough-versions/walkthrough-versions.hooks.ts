import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { populateCreator } from './hooks/populateCreator';
import { validateApproval } from './hooks/validateApproval';
import { populateApprovals } from './hooks/populateApprovals';
import { syncPublishedVersion } from './hooks/syncPublishedVersion';

export const walkthroughVersionsHooks = {
    before: {
        all: [authenticate],
        find: [
            // Any project member can view version history
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        get: [
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        create: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
            validateApproval
        ],
        patch: [
            requireProjectAccess({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
            validateApproval
        ],
        remove: [
            requireProjectAccess({ minRole: 'owner', resolveProject: 'fromWalkthrough' }),
        ]
    },
    after: {
        all: [populateCreator, populateApprovals],
        create: [syncPublishedVersion],
        patch: [syncPublishedVersion],
    },
    error: {}
};
