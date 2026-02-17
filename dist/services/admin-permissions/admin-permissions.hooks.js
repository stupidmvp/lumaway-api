"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPermissionsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireSuperAdmin_1 = require("../../hooks/requireSuperAdmin");
const findPermissions_1 = require("./hooks/findPermissions");
exports.adminPermissionsHooks = {
    before: {
        all: [authenticate_1.authenticate, requireSuperAdmin_1.requireSuperAdmin],
        find: [findPermissions_1.findPermissions],
    },
};
