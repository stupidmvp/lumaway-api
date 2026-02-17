"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResetPasswordService = void 0;
const adapters_1 = require("../../adapters");
const auth_reset_password_class_1 = require("./auth-reset-password.class");
const auth_reset_password_hooks_1 = require("./auth-reset-password.hooks");
exports.authResetPasswordService = new auth_reset_password_class_1.AuthResetPasswordService(adapters_1.drizzleAdapter);
exports.authResetPasswordService.hooks(auth_reset_password_hooks_1.authResetPasswordHooks);
