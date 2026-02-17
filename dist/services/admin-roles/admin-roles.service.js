"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRolesService = void 0;
const adapters_1 = require("../../adapters");
const admin_roles_class_1 = require("./admin-roles.class");
const admin_roles_hooks_1 = require("./admin-roles.hooks");
exports.adminRolesService = new admin_roles_class_1.AdminRolesService(adapters_1.drizzleAdapter);
exports.adminRolesService.hooks(admin_roles_hooks_1.adminRolesHooks);
