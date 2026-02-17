import { authenticate } from '../../hooks/authenticate';
import { requireSuperAdmin } from '../../hooks/requireSuperAdmin';
import { patchUserRoles } from './hooks/patchUserRoles';

export const adminUserRolesHooks = {
    before: {
        all: [authenticate, requireSuperAdmin],
        patch: [patchUserRoles],
    },
};
