"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRolesHook = addRolesHook;
const roles_1 = require("../utils/roles");
/**
 * Authentication hook to add RBAC roles to auth result
 */
function addRolesHook(storage) {
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
        // Get user roles and add them to the result
        const roles = await (0, roles_1.getUserRoles)(storage, userId);
        // Enrich the authentication result with roles
        context.result = {
            ...context.result,
            roles
        };
        return context;
    };
}
