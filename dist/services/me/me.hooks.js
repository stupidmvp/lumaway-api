"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const findCurrentUser_1 = require("./hooks/findCurrentUser");
const patchCurrentUser_1 = require("./hooks/patchCurrentUser");
exports.meHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [findCurrentUser_1.findCurrentUser],
        patch: [patchCurrentUser_1.patchCurrentUser],
    },
};
