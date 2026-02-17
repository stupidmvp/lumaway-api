import { authenticate } from '../../hooks/authenticate';
import { requireSuperAdmin } from '../../hooks/requireSuperAdmin';
import { findPermissions } from './hooks/findPermissions';

export const adminPermissionsHooks = {
    before: {
        all: [authenticate, requireSuperAdmin],
        find: [findPermissions],
    },
};
