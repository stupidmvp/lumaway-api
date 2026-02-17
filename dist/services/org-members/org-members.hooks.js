"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgMembersHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const findOrgMembers_1 = require("./hooks/findOrgMembers");
const patchOrgMember_1 = require("./hooks/patchOrgMember");
const removeOrgMember_1 = require("./hooks/removeOrgMember");
exports.orgMembersHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [findOrgMembers_1.findOrgMembers],
        patch: [patchOrgMember_1.patchOrgMember],
        remove: [removeOrgMember_1.removeOrgMember],
    },
};
