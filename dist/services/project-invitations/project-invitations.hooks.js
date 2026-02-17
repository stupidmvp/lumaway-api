"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectInvitationsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const prepareInvitation_1 = require("./hooks/prepareInvitation");
const checkDuplicateInvitation_1 = require("./hooks/checkDuplicateInvitation");
const sendInvitationEmail_1 = require("./hooks/sendInvitationEmail");
const createInvitationNotification_1 = require("./hooks/createInvitationNotification");
const populateInvitationRelations_1 = require("./hooks/populateInvitationRelations");
exports.projectInvitationsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            // Any member can see invitations for their project
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
        ],
        get: [],
        create: [
            // Only owners can invite
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
            checkDuplicateInvitation_1.checkDuplicateInvitation,
            prepareInvitation_1.prepareInvitation,
        ],
        patch: [
            // Only owners can modify invitations
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
        ],
        remove: [
            // Only owners can revoke invitations
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'owner', resolveProject: 'direct' }),
        ],
    },
    after: {
        all: [populateInvitationRelations_1.populateInvitationRelations],
        create: [sendInvitationEmail_1.sendInvitationEmail, createInvitationNotification_1.createInvitationNotification],
    },
};
