"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRolePermissionsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireSuperAdmin_1 = require("../../hooks/requireSuperAdmin");
const getRolePermissions_1 = require("./hooks/getRolePermissions");
const patchRolePermissions_1 = require("./hooks/patchRolePermissions");
exports.adminRolePermissionsHooks = {
    before: {
        all: [authenticate_1.authenticate, requireSuperAdmin_1.requireSuperAdmin],
        get: [getRolePermissions_1.getRolePermissions],
        patch: [patchRolePermissions_1.patchRolePermissions],
    },
};
