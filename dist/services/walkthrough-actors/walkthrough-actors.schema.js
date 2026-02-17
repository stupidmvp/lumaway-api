"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughActorsPatchSchema = exports.walkthroughActorsCreateSchema = exports.walkthroughActorsSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../../db/schema");
const drizzle_zod_1 = require("drizzle-zod");
exports.walkthroughActorsSchema = (0, drizzle_zod_1.createSelectSchema)(schema_1.walkthroughActors);
exports.walkthroughActorsCreateSchema = (0, drizzle_zod_1.createInsertSchema)(schema_1.walkthroughActors, {
    walkthroughId: zod_1.z.string().uuid(),
    actorId: zod_1.z.string().uuid(),
}).omit({
    createdAt: true,
});
exports.walkthroughActorsPatchSchema = exports.walkthroughActorsCreateSchema.partial();
