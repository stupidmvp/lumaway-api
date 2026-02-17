"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRegisterHooks = void 0;
const registerUser_1 = require("./hooks/registerUser");
// auth-register is a public endpoint — no authentication required
exports.authRegisterHooks = {
    before: {
        all: [],
        create: [registerUser_1.registerUser],
    },
};
