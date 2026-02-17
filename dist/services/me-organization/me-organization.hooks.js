"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meOrganizationHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const findActiveOrganization_1 = require("./hooks/findActiveOrganization");
const patchActiveOrganization_1 = require("./hooks/patchActiveOrganization");
exports.meOrganizationHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [findActiveOrganization_1.findActiveOrganization],
        patch: [patchActiveOrganization_1.patchActiveOrganization],
    },
};
