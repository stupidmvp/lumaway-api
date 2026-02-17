"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationAcceptService = void 0;
const adapters_1 = require("../../adapters");
const invitation_accept_class_1 = require("./invitation-accept.class");
const invitation_accept_hooks_1 = require("./invitation-accept.hooks");
exports.invitationAcceptService = new invitation_accept_class_1.InvitationAcceptService(adapters_1.drizzleAdapter);
exports.invitationAcceptService.hooks(invitation_accept_hooks_1.invitationAcceptHooks);
