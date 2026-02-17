"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRolesService = void 0;
const adapters_1 = require("../../adapters");
const user_roles_class_1 = require("./user-roles.class");
exports.userRolesService = new user_roles_class_1.UserRolesService(adapters_1.drizzleAdapter);
