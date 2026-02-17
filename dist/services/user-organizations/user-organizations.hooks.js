"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrganizationsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const createOrganization_1 = require("./hooks/createOrganization");
const removeOrganization_1 = require("./hooks/removeOrganization");
exports.userOrganizationsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [createOrganization_1.createOrganization],
        remove: [removeOrganization_1.removeOrganization],
    },
};
