"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authForgotPasswordHooks = void 0;
const sendResetEmail_1 = require("./hooks/sendResetEmail");
// auth-forgot-password is a public endpoint — no authentication required
exports.authForgotPasswordHooks = {
    before: {
        all: [],
        create: [sendResetEmail_1.sendResetEmail],
    },
};
