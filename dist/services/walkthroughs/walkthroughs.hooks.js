"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const createVersionOnUpdate_1 = require("./hooks/createVersionOnUpdate");
const populateWalkthroughRelations_1 = require("./hooks/populateWalkthroughRelations");
const filterByMembership_1 = require("./hooks/filterByMembership");
const search_1 = require("../../hooks/search");
const castQuery_1 = require("../../hooks/castQuery");
exports.walkthroughsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({ booleans: ['isPublished'] }),
            (0, search_1.search)({ fields: ['title'] }),
            filterByMembership_1.filterByMembership,
        ],
        create: [
            // Editors+ can create walkthroughs — projectId is in context.data
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'direct' }),
        ],
        update: [
            // context.id IS the walkthrough — resolve project from it
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthroughSelf' }),
            (0, createVersionOnUpdate_1.captureStateBeforeUpdate)(),
        ],
        patch: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromWalkthroughSelf' }),
            (0, createVersionOnUpdate_1.captureStateBeforeUpdate)(),
        ],
        remove: [
            // Only owners can delete walkthroughs
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'fromWalkthroughSelf' }),
        ]
    },
    after: {
        all: [populateWalkthroughRelations_1.populateWalkthroughRelations],
        create: [],
        update: [(0, createVersionOnUpdate_1.createVersionAfterUpdate)()],
        patch: [(0, createVersionOnUpdate_1.createVersionAfterUpdate)()],
        remove: []
    }
};
