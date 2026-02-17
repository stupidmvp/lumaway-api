"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authChangePasswordHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const changePassword_1 = require("./hooks/changePassword");
exports.authChangePasswordHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [changePassword_1.changePassword],
    },
};
