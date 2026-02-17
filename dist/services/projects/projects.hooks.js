"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsHooks = void 0;
const populateUserContext_1 = require("../../hooks/populateUserContext");
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const validateProjectData_1 = require("./hooks/validateProjectData");
const generateApiKey_1 = require("./hooks/generateApiKey");
const populateApiKey_1 = require("./hooks/populateApiKey");
const populateProjectRelations_1 = require("./hooks/populateProjectRelations");
const addCreatorAsMember_1 = require("./hooks/addCreatorAsMember");
const filterProjectsByAccess_1 = require("./hooks/filterProjectsByAccess");
const search_1 = require("../../hooks/search");
const castQuery_1 = require("../../hooks/castQuery");
exports.projectsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({}),
            filterProjectsByAccess_1.filterProjectsByAccess,
            (0, search_1.search)({ fields: ['name'] })
        ],
        get: [],
        create: [populateUserContext_1.populateUserContext, validateProjectData_1.validateProjectData],
        update: [
            populateUserContext_1.populateUserContext,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'fromId' }),
        ],
        patch: [
            populateUserContext_1.populateUserContext,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'fromId' }),
        ],
        remove: [
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'fromId' }),
        ]
    },
    after: {
        all: [populateApiKey_1.populateApiKey, populateProjectRelations_1.populateProjectRelations],
        create: [generateApiKey_1.generateApiKey, addCreatorAsMember_1.addCreatorAsMember]
    }
};
