"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actorsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const filterActorsByProject_1 = require("./hooks/filterActorsByProject");
const generateSlug_1 = require("./hooks/generateSlug");
const search_1 = require("../../hooks/search");
const castQuery_1 = require("../../hooks/castQuery");
exports.actorsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({}),
            (0, search_1.search)({ fields: ['name'] }),
            filterActorsByProject_1.filterActorsByProject,
        ],
        create: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'direct' }),
            generateSlug_1.generateSlug,
        ],
        patch: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromActorSelf' }),
            generateSlug_1.generateSlug,
        ],
        remove: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'editor', resolveProject: 'fromActorSelf' }),
        ],
    },
    after: {
        all: [],
    }
};
