"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissionsService = void 0;
const adapters_1 = require("../../adapters");
const role_permissions_class_1 = require("./role-permissions.class");
exports.rolePermissionsService = new role_permissions_class_1.RolePermissionsService(adapters_1.drizzleAdapter);
