"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResetPasswordHooks = void 0;
const resetPassword_1 = require("./hooks/resetPassword");
// auth-reset-password is a public endpoint — no authentication required
exports.authResetPasswordHooks = {
    before: {
        all: [],
        create: [resetPassword_1.resetPassword],
    },
};
