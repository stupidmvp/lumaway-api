"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughVersionsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const populateCreator_1 = require("./hooks/populateCreator");
exports.walkthroughVersionsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            // Any project member can view version history
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        get: [],
    },
    after: {
        all: [populateCreator_1.populateCreator],
    },
    error: {}
};
