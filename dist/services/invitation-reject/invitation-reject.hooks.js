"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRejectHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const rejectInvitation_1 = require("./hooks/rejectInvitation");
exports.invitationRejectHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [rejectInvitation_1.rejectInvitation],
    },
};
