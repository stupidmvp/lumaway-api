"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgMembersService = void 0;
const adapters_1 = require("../../adapters");
const org_members_class_1 = require("./org-members.class");
const org_members_hooks_1 = require("./org-members.hooks");
exports.orgMembersService = new org_members_class_1.OrgMembersService(adapters_1.drizzleAdapter);
exports.orgMembersService.hooks(org_members_hooks_1.orgMembersHooks);
