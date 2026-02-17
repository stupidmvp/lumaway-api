"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationDetailsService = void 0;
const adapters_1 = require("../../adapters");
const invitation_details_class_1 = require("./invitation-details.class");
const invitation_details_hooks_1 = require("./invitation-details.hooks");
exports.invitationDetailsService = new invitation_details_class_1.InvitationDetailsService(adapters_1.drizzleAdapter);
exports.invitationDetailsService.hooks(invitation_details_hooks_1.invitationDetailsHooks);
