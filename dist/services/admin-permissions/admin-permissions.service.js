"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPermissionsService = void 0;
const adapters_1 = require("../../adapters");
const admin_permissions_class_1 = require("./admin-permissions.class");
const admin_permissions_hooks_1 = require("./admin-permissions.hooks");
exports.adminPermissionsService = new admin_permissions_class_1.AdminPermissionsService(adapters_1.drizzleAdapter);
exports.adminPermissionsService.hooks(admin_permissions_hooks_1.adminPermissionsHooks);
