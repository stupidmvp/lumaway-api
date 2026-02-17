"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrganizationLeaveHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const leaveOrganization_1 = require("./hooks/leaveOrganization");
exports.userOrganizationLeaveHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [leaveOrganization_1.leaveOrganization],
    },
};
