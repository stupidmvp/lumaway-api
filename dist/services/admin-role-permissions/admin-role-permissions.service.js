"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRolePermissionsService = void 0;
const adapters_1 = require("../../adapters");
const admin_role_permissions_class_1 = require("./admin-role-permissions.class");
const admin_role_permissions_hooks_1 = require("./admin-role-permissions.hooks");
exports.adminRolePermissionsService = new admin_role_permissions_class_1.AdminRolePermissionsService(adapters_1.drizzleAdapter);
exports.adminRolePermissionsService.hooks(admin_role_permissions_hooks_1.adminRolePermissionsHooks);
