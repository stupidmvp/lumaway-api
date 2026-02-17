"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsService = void 0;
const adapters_1 = require("../../adapters");
const projects_class_1 = require("./projects.class");
const projects_hooks_1 = require("./projects.hooks");
const schema_1 = require("../../db/schema");
const projects_schema_1 = require("./projects.schema");
exports.projectsService = new projects_class_1.ProjectsService(adapters_1.drizzleAdapter, schema_1.projects, projects_schema_1.projectsCreateSchema, projects_schema_1.projectsPatchSchema);
// Apply hooks
if (exports.projectsService.hooks) {
    exports.projectsService.hooks(projects_hooks_1.projectsHooks);
}
