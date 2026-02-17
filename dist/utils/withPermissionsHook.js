"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPermissionsHook = withPermissionsHook;
const addPermissionsHook_1 = require("../hooks/addPermissionsHook");
function withPermissionsHook(strategy, storage) {
    const originalAuthenticate = strategy.authenticate.bind(strategy);
    const permissionsHook = (0, addPermissionsHook_1.addPermissionsHook)(storage);
    return {
        ...strategy,
        authenticate: async (data, authService) => {
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
