"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const adapters_1 = require("../../adapters");
const users_class_1 = require("./users.class");
const users_hooks_1 = require("./users.hooks");
exports.usersService = new users_class_1.UsersService(adapters_1.drizzleAdapter);
// Apply hooks
if (exports.usersService.hooks) {
    exports.usersService.hooks(users_hooks_1.usersHooks);
}
