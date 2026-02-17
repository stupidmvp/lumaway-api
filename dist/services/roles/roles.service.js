"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesService = void 0;
const adapters_1 = require("../../adapters");
const roles_class_1 = require("./roles.class");
exports.rolesService = new roles_class_1.RolesService(adapters_1.drizzleAdapter);
