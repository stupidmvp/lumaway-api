import { authenticate } from '../../hooks/authenticate';
import { requireSuperAdmin } from '../../hooks/requireSuperAdmin';
import { findAdminUsers } from './hooks/findAdminUsers';
import { getAdminUser } from './hooks/getAdminUser';
import { patchAdminUser } from './hooks/patchAdminUser';

export const adminUsersHooks = {
    before: {
        all: [authenticate, requireSuperAdmin],
        find: [findAdminUsers],
        get: [getAdminUser],
        patch: [patchAdminUser],
    },
};
