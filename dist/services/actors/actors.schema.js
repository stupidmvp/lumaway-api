"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actorsPatchSchema = exports.actorsCreateSchema = exports.actorsSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
exports.actorsSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.actors);
exports.actorsCreateSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.actors, {
    projectId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must be lowercase alphanumeric with hyphens (e.g., "sales-rep")',
    }),
    description: zod_1.z.string().max(500).optional(),
    color: zod_1.z.string().max(20).optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.actorsPatchSchema = exports.actorsCreateSchema.partial().omit({
    projectId: true, // Should not change project
});
