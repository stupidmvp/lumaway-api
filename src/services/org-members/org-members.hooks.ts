import { authenticate } from '../../hooks/authenticate';
import { findOrgMembers } from './hooks/findOrgMembers';
import { patchOrgMember } from './hooks/patchOrgMember';
import { removeOrgMember } from './hooks/removeOrgMember';

export const orgMembersHooks = {
    before: {
        all: [authenticate],
        find: [findOrgMembers],
        patch: [patchOrgMember],
        remove: [removeOrgMember],
    },
};
