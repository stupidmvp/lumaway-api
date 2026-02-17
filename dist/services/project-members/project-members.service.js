"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectMembersService = void 0;
const adapters_1 = require("../../adapters");
const project_members_class_1 = require("./project-members.class");
const project_members_hooks_1 = require("./project-members.hooks");
const schema_1 = require("../../db/schema");
const project_members_schema_1 = require("./project-members.schema");
exports.projectMembersService = new project_members_class_1.ProjectMembersService(adapters_1.drizzleAdapter, schema_1.projectMembers, project_members_schema_1.projectMembersCreateSchema, project_members_schema_1.projectMembersPatchSchema);
// Apply hooks
if (exports.projectMembersService.hooks) {
    exports.projectMembersService.hooks(project_members_hooks_1.projectMembersHooks);
}
