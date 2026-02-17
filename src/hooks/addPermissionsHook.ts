import { DrizzleAdapter } from '@flex-donec/core';
import { getUserPermissions } from '../utils/permissions';
import type { AuthResult } from '../types';

/**
 * Authentication hook to add RBAC permissions to auth result
 */
export function addPermissionsHook(storage: DrizzleAdapter) {
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

        // Get user permissions and add them to the result
        const permissions = await getUserPermissions(storage, userId);

        // Enrich the authentication result with permissions
        context.result = {
            ...context.result,
            permissions
        };

        return context;
    };
}
