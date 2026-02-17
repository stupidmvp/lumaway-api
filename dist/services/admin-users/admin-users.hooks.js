"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireSuperAdmin_1 = require("../../hooks/requireSuperAdmin");
const findAdminUsers_1 = require("./hooks/findAdminUsers");
const getAdminUser_1 = require("./hooks/getAdminUser");
const patchAdminUser_1 = require("./hooks/patchAdminUser");
exports.adminUsersHooks = {
    before: {
        all: [authenticate_1.authenticate, requireSuperAdmin_1.requireSuperAdmin],
        find: [findAdminUsers_1.findAdminUsers],
        get: [getAdminUser_1.getAdminUser],
        patch: [patchAdminUser_1.patchAdminUser],
    },
};
