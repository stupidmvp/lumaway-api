import { authenticate } from '../../hooks/authenticate';
import { findUserOrganizations } from './hooks/findUserOrganizations';

export const meOrganizationsHooks = {
    before: {
        all: [authenticate],
        find: [findUserOrganizations],
    },
};
