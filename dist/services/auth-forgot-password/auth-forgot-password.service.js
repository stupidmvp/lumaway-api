"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authForgotPasswordService = void 0;
const adapters_1 = require("../../adapters");
const auth_forgot_password_class_1 = require("./auth-forgot-password.class");
const auth_forgot_password_hooks_1 = require("./auth-forgot-password.hooks");
exports.authForgotPasswordService = new auth_forgot_password_class_1.AuthForgotPasswordService(adapters_1.drizzleAdapter);
exports.authForgotPasswordService.hooks(auth_forgot_password_hooks_1.authForgotPasswordHooks);
