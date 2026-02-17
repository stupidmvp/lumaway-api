"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authChangePasswordService = void 0;
const adapters_1 = require("../../adapters");
const auth_change_password_class_1 = require("./auth-change-password.class");
const auth_change_password_hooks_1 = require("./auth-change-password.hooks");
exports.authChangePasswordService = new auth_change_password_class_1.AuthChangePasswordService(adapters_1.drizzleAdapter);
exports.authChangePasswordService.hooks(auth_change_password_hooks_1.authChangePasswordHooks);
