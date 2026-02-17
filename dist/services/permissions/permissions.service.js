"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionsService = void 0;
const adapters_1 = require("../../adapters");
const permissions_class_1 = require("./permissions.class");
exports.permissionsService = new permissions_class_1.PermissionsService(adapters_1.drizzleAdapter);
