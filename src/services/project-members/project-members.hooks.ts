import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { populateMemberUser } from './hooks/populateMemberUser';
import { resolveProjectFromMember } from './hooks/resolveProjectFromMember';
import { preventLastOwnerRemoval } from './hooks/preventLastOwnerRemoval';
import { searchMembers } from './hooks/searchMembers';
import { excludeProjectOwner } from './hooks/excludeProjectOwner';
import { castQuery } from '../../hooks/castQuery';

export const projectMembersHooks = {
    before: {
        all: [authenticate],
        find: [
            castQuery({}),
            // Viewers can list members (projectId in query)
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            searchMembers,
            excludeProjectOwner,
        ],
        get: [],
        create: [
            // Only owners can add members (projectId in data)
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
        ],
        patch: [
            // Resolve projectId from the member record, then check ownership
            resolveProjectFromMember,
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
            preventLastOwnerRemoval,
        ],
        remove: [
            resolveProjectFromMember,
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
            preventLastOwnerRemoval,
        ],
    },
    after: {
        all: [populateMemberUser],
    },
};
