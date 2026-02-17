"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationDetailsHooks = void 0;
const getInvitationDetails_1 = require("./hooks/getInvitationDetails");
// invitation-details is a public endpoint — no authentication required
exports.invitationDetailsHooks = {
    before: {
        all: [],
        get: [getInvitationDetails_1.getInvitationDetails],
    },
};
