"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersService = void 0;
const adapters_1 = require("../../adapters");
const admin_users_class_1 = require("./admin-users.class");
const admin_users_hooks_1 = require("./admin-users.hooks");
exports.adminUsersService = new admin_users_class_1.AdminUsersService(adapters_1.drizzleAdapter);
exports.adminUsersService.hooks(admin_users_hooks_1.adminUsersHooks);
