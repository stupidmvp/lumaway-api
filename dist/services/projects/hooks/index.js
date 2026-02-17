"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsHooks = void 0;
const populateUserContext_1 = require("../../../hooks/populateUserContext");
const authenticate_1 = require("../../../hooks/authenticate");
const validateProjectData_1 = require("./validateProjectData");
exports.projectsHooks = {
    before: {
        create: [authenticate_1.authenticate, populateUserContext_1.populateUserContext, validateProjectData_1.validateProjectData],
        update: [authenticate_1.authenticate, populateUserContext_1.populateUserContext],
        patch: [authenticate_1.authenticate, populateUserContext_1.populateUserContext],
        remove: [authenticate_1.authenticate]
    }
};
