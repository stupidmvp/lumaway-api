"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientProjectHooks = void 0;
const findClientProjectConfig_1 = require("./hooks/findClientProjectConfig");
exports.clientProjectHooks = {
    before: {
        all: [],
        find: [findClientProjectConfig_1.findClientProjectConfig],
    },
};
