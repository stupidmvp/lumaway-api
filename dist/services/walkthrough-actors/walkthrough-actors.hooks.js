"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughActorsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
exports.walkthroughActorsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            // Requires walkthroughId in query — access is checked via walkthrough's project
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        create: [
            // Assigning actors requires editor access
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
        ],
        remove: [
            // Removing actors requires editor access
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
        ],
    },
    after: {
        all: [],
    }
};
