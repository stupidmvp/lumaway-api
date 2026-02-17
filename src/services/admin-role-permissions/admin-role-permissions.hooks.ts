import { authenticate } from '../../hooks/authenticate';
import { requireSuperAdmin } from '../../hooks/requireSuperAdmin';
import { getRolePermissions } from './hooks/getRolePermissions';
import { patchRolePermissions } from './hooks/patchRolePermissions';

export const adminRolePermissionsHooks = {
    before: {
        all: [authenticate, requireSuperAdmin],
        get: [getRolePermissions],
        patch: [patchRolePermissions],
    },
};
