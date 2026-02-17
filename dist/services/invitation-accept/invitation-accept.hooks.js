"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationAcceptHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const acceptInvitation_1 = require("./hooks/acceptInvitation");
exports.invitationAcceptHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [acceptInvitation_1.acceptInvitation],
    },
};
