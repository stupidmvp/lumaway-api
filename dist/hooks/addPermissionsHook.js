"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPermissionsHook = addPermissionsHook;
const permissions_1 = require("../utils/permissions");
/**
 * Authentication hook to add RBAC permissions to auth result
 */
function addPermissionsHook(storage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (context) => {
        // Only process if authentication was successful and we have a user
        const result = context.result;
        if (!result || !result.user) {
            return context;
        }
        const userId = context.result.user.id;
        if (!userId) {
            return context;
        }
        // Get user permissions and add them to the result
        const permissions = await (0, permissions_1.getUserPermissions)(storage, userId);
        // Enrich the authentication result with permissions
        context.result = {
            ...context.result,
            permissions
        };
        return context;
    };
}
