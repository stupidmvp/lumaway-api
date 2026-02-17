"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserRolesService = void 0;
const adapters_1 = require("../../adapters");
const admin_user_roles_class_1 = require("./admin-user-roles.class");
const admin_user_roles_hooks_1 = require("./admin-user-roles.hooks");
exports.adminUserRolesService = new admin_user_roles_class_1.AdminUserRolesService(adapters_1.drizzleAdapter);
exports.adminUserRolesService.hooks(admin_user_roles_hooks_1.adminUserRolesHooks);
