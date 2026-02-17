"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrganizationLeaveService = void 0;
const adapters_1 = require("../../adapters");
const user_organization_leave_class_1 = require("./user-organization-leave.class");
const user_organization_leave_hooks_1 = require("./user-organization-leave.hooks");
exports.userOrganizationLeaveService = new user_organization_leave_class_1.UserOrganizationLeaveService(adapters_1.drizzleAdapter);
exports.userOrganizationLeaveService.hooks(user_organization_leave_hooks_1.userOrganizationLeaveHooks);
