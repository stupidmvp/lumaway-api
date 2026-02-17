import { getUserRoles } from '../utils/roles';
import { drizzleAdapter } from '../adapters';

/**
 * Hook that requires the authenticated user to have the `superadmin` global role.
 * Must be used AFTER the `authenticate` hook so that `context.params.user` is populated.
 */
export const requireSuperAdmin = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    const roles = await getUserRoles(drizzleAdapter, userId);
    if (!roles.includes('superadmin')) {
        throw new Error('Superadmin access required');
    }

    return context;
};

