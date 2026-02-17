"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = void 0;
const roles_1 = require("../utils/roles");
const adapters_1 = require("../adapters");
/**
 * Hook that requires the authenticated user to have the `superadmin` global role.
 * Must be used AFTER the `authenticate` hook so that `context.params.user` is populated.
 */
const requireSuperAdmin = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
    const roles = await (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, userId);
    if (!roles.includes('superadmin')) {
        throw new Error('Superadmin access required');
    }
    return context;
};
exports.requireSuperAdmin = requireSuperAdmin;
