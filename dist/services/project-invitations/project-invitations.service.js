"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectInvitationsService = void 0;
const adapters_1 = require("../../adapters");
const project_invitations_class_1 = require("./project-invitations.class");
const project_invitations_hooks_1 = require("./project-invitations.hooks");
const schema_1 = require("../../db/schema");
const project_invitations_schema_1 = require("./project-invitations.schema");
exports.projectInvitationsService = new project_invitations_class_1.ProjectInvitationsService(adapters_1.drizzleAdapter, schema_1.projectInvitations, project_invitations_schema_1.projectInvitationsCreateSchema, project_invitations_schema_1.projectInvitationsPatchSchema);
// Apply hooks
if (exports.projectInvitationsService.hooks) {
    exports.projectInvitationsService.hooks(project_invitations_hooks_1.projectInvitationsHooks);
}
