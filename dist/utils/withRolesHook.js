"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRolesHook = withRolesHook;
const addRolesHook_1 = require("../hooks/addRolesHook");
function withRolesHook(strategy, storage) {
    const originalAuthenticate = strategy.authenticate.bind(strategy);
    const rolesHook = (0, addRolesHook_1.addRolesHook)(storage);
    return {
        ...strategy,
        authenticate: async (data, authService) => {
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
