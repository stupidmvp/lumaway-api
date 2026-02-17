import { authenticate } from '../../hooks/authenticate';
import { requireSuperAdmin } from '../../hooks/requireSuperAdmin';
import { findRoles } from './hooks/findRoles';
import { createRole } from './hooks/createRole';
import { patchRole } from './hooks/patchRole';
import { removeRole } from './hooks/removeRole';

export const adminRolesHooks = {
    before: {
        all: [authenticate, requireSuperAdmin],
        find: [findRoles],
        create: [createRole],
        patch: [patchRole],
        remove: [removeRole],
    },
};
