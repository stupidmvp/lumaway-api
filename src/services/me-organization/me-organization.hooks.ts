import { authenticate } from '../../hooks/authenticate';
import { findActiveOrganization } from './hooks/findActiveOrganization';
import { patchActiveOrganization } from './hooks/patchActiveOrganization';

export const meOrganizationHooks = {
    before: {
        all: [authenticate],
        find: [findActiveOrganization],
        patch: [patchActiveOrganization],
    },
};
