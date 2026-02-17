"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meOrganizationsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const findUserOrganizations_1 = require("./hooks/findUserOrganizations");
exports.meOrganizationsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [findUserOrganizations_1.findUserOrganizations],
    },
};
