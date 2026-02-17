"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectSettingsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
exports.projectSettingsHooks = {
    before: {
        all: [authenticate_1.authenticate],
    },
};
