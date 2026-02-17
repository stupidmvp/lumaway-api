"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRegisterService = void 0;
const adapters_1 = require("../../adapters");
const auth_register_class_1 = require("./auth-register.class");
const auth_register_hooks_1 = require("./auth-register.hooks");
exports.authRegisterService = new auth_register_class_1.AuthRegisterService(adapters_1.drizzleAdapter);
exports.authRegisterService.hooks(auth_register_hooks_1.authRegisterHooks);
