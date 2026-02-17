"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsPatchSchema = exports.projectsCreateSchema = exports.projectsSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
const projects_settings_schema_1 = require("./projects.settings-schema");
exports.projectsSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.projects);
exports.projectsCreateSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.projects, {
    organizationId: zod_1.z.string().uuid().optional(), // Populated by hook
    ownerId: zod_1.z.string().uuid().optional(), // Populated by hook
    settings: projects_settings_schema_1.projectSettingsSchema.optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.projectsPatchSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.projects, {
    settings: projects_settings_schema_1.projectSettingsSchema.optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    organizationId: true, // Should not change org usually
}).partial();
