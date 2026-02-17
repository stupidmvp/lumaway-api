"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectMembersHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const populateMemberUser_1 = require("./hooks/populateMemberUser");
const resolveProjectFromMember_1 = require("./hooks/resolveProjectFromMember");
const preventLastOwnerRemoval_1 = require("./hooks/preventLastOwnerRemoval");
const searchMembers_1 = require("./hooks/searchMembers");
const excludeProjectOwner_1 = require("./hooks/excludeProjectOwner");
const castQuery_1 = require("../../hooks/castQuery");
exports.projectMembersHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({}),
            // Viewers can list members (projectId in query)
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            searchMembers_1.searchMembers,
            excludeProjectOwner_1.excludeProjectOwner,
        ],
        get: [],
        create: [
            // Only owners can add members (projectId in data)
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
        ],
        patch: [
            // Resolve projectId from the member record, then check ownership
            resolveProjectFromMember_1.resolveProjectFromMember,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
            preventLastOwnerRemoval_1.preventLastOwnerRemoval,
        ],
        remove: [
            resolveProjectFromMember_1.resolveProjectFromMember,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
            preventLastOwnerRemoval_1.preventLastOwnerRemoval,
        ],
    },
    after: {
        all: [populateMemberUser_1.populateMemberUser],
    },
};
