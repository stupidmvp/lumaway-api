"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfilesHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const getUserProfile_1 = require("./hooks/getUserProfile");
exports.userProfilesHooks = {
    before: {
        all: [authenticate_1.authenticate],
        get: [getUserProfile_1.getUserProfile],
    },
};
