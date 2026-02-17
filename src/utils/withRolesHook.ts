import { AuthenticationStrategy, DrizzleAdapter } from '@flex-donec/core';
import { addRolesHook } from '../hooks/addRolesHook';

export function withRolesHook(
    strategy: AuthenticationStrategy,
    storage: DrizzleAdapter
): AuthenticationStrategy {
    const originalAuthenticate = strategy.authenticate.bind(strategy);
    const rolesHook = addRolesHook(storage);

    return {
        ...strategy,
        authenticate: async (data: any, authService?: any) => {
            const result = await originalAuthenticate(data, authService);

            const context = {
                result,
                data,
                strategy: strategy.name
            };

            const enrichedContext = await rolesHook(context);

            return enrichedContext.result;
        }
    };
}
