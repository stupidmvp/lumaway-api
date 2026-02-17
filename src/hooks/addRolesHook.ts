import { DrizzleAdapter } from '@flex-donec/core';
import { getUserRoles } from '../utils/roles';
import type { AuthResult } from '../types';

/**
 * Authentication hook to add RBAC roles to auth result
 */
export function addRolesHook(storage: DrizzleAdapter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (context: any): Promise<any> => {
        // Only process if authentication was successful and we have a user
        const result = context.result as AuthResult | undefined;
        if (!result || !result.user) {
            return context;
        }

        const userId = context.result.user.id;

        if (!userId) {
            return context;
        }

        // Get user roles and add them to the result
        const roles = await getUserRoles(storage, userId);

        // Enrich the authentication result with roles
        context.result = {
            ...context.result,
            roles
        };

        return context;
    };
}
