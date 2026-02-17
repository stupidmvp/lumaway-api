"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRolesHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireSuperAdmin_1 = require("../../hooks/requireSuperAdmin");
const findRoles_1 = require("./hooks/findRoles");
const createRole_1 = require("./hooks/createRole");
const patchRole_1 = require("./hooks/patchRole");
const removeRole_1 = require("./hooks/removeRole");
exports.adminRolesHooks = {
    before: {
        all: [authenticate_1.authenticate, requireSuperAdmin_1.requireSuperAdmin],
        find: [findRoles_1.findRoles],
        create: [createRole_1.createRole],
        patch: [patchRole_1.patchRole],
        remove: [removeRole_1.removeRole],
    },
};
