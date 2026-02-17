import { authenticate } from '../../hooks/authenticate';
import { createOrganization } from './hooks/createOrganization';
import { removeOrganization } from './hooks/removeOrganization';

export const userOrganizationsHooks = {
    before: {
        all: [authenticate],
        create: [createOrganization],
        remove: [removeOrganization],
    },
};
