"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrganizationsService = void 0;
const adapters_1 = require("../../adapters");
const user_organizations_class_1 = require("./user-organizations.class");
const user_organizations_hooks_1 = require("./user-organizations.hooks");
exports.userOrganizationsService = new user_organizations_class_1.UserOrganizationsService(adapters_1.drizzleAdapter);
exports.userOrganizationsService.hooks(user_organizations_hooks_1.userOrganizationsHooks);
