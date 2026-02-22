"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientWalkthroughVersionsHooks = void 0;
const findClientWalkthroughVersions_1 = require("./hooks/findClientWalkthroughVersions");
exports.clientWalkthroughVersionsHooks = {
    before: {
        all: [],
        find: [findClientWalkthroughVersions_1.findClientWalkthroughVersions],
    },
};
