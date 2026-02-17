"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actorsService = void 0;
const adapters_1 = require("../../adapters");
const actors_class_1 = require("./actors.class");
const actors_hooks_1 = require("./actors.hooks");
const schema_1 = require("../../db/schema");
const actors_schema_1 = require("./actors.schema");
exports.actorsService = new actors_class_1.ActorsService(adapters_1.drizzleAdapter, schema_1.actors, actors_schema_1.actorsCreateSchema, actors_schema_1.actorsPatchSchema);
// Apply hooks
if (exports.actorsService.hooks) {
    exports.actorsService.hooks(actors_hooks_1.actorsHooks);
}
