"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughVersionsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const populateCreator_1 = require("./hooks/populateCreator");
const validateApproval_1 = require("./hooks/validateApproval");
const populateApprovals_1 = require("./hooks/populateApprovals");
const syncPublishedVersion_1 = require("./hooks/syncPublishedVersion");
exports.walkthroughVersionsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            // Any project member can view version history
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        get: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'fromWalkthrough' }),
        ],
        create: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
            validateApproval_1.validateApproval
        ],
        patch: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthrough' }),
            validateApproval_1.validateApproval
        ],
        remove: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'fromWalkthrough' }),
        ]
    },
    after: {
        all: [populateCreator_1.populateCreator, populateApprovals_1.populateApprovals],
        create: [syncPublishedVersion_1.syncPublishedVersion],
        patch: [syncPublishedVersion_1.syncPublishedVersion],
    },
    error: {}
};
