"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRejectService = void 0;
const adapters_1 = require("../../adapters");
const invitation_reject_class_1 = require("./invitation-reject.class");
const invitation_reject_hooks_1 = require("./invitation-reject.hooks");
exports.invitationRejectService = new invitation_reject_class_1.InvitationRejectService(adapters_1.drizzleAdapter);
exports.invitationRejectService.hooks(invitation_reject_hooks_1.invitationRejectHooks);
