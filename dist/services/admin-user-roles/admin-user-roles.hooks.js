"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserRolesHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireSuperAdmin_1 = require("../../hooks/requireSuperAdmin");
const patchUserRoles_1 = require("./hooks/patchUserRoles");
exports.adminUserRolesHooks = {
    before: {
        all: [authenticate_1.authenticate, requireSuperAdmin_1.requireSuperAdmin],
        patch: [patchUserRoles_1.patchUserRoles],
    },
};
