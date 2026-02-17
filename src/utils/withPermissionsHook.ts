import { AuthenticationStrategy, DrizzleAdapter } from '@flex-donec/core';
import { addPermissionsHook } from '../hooks/addPermissionsHook';

export function withPermissionsHook(
    strategy: AuthenticationStrategy,
    storage: DrizzleAdapter
): AuthenticationStrategy {
    const originalAuthenticate = strategy.authenticate.bind(strategy);
    const permissionsHook = addPermissionsHook(storage);

    return {
        ...strategy,
        authenticate: async (data: any, authService?: any) => {
            const result = await originalAuthenticate(data, authService);

            const context = {
                result,
                data,
                strategy: strategy.name
            };

            const enrichedContext = await permissionsHook(context);

            return enrichedContext.result;
        }
    };
}
