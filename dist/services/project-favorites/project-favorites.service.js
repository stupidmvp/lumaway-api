"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectFavoritesService = void 0;
const adapters_1 = require("../../adapters");
const project_favorites_class_1 = require("./project-favorites.class");
const project_favorites_hooks_1 = require("./project-favorites.hooks");
const schema_1 = require("../../db/schema");
const project_favorites_schema_1 = require("./project-favorites.schema");
exports.projectFavoritesService = new project_favorites_class_1.ProjectFavoritesService(adapters_1.drizzleAdapter, schema_1.projectFavorites, project_favorites_schema_1.projectFavoritesCreateSchema, project_favorites_schema_1.projectFavoritesPatchSchema);
// Apply hooks
if (exports.projectFavoritesService.hooks) {
    exports.projectFavoritesService.hooks(project_favorites_hooks_1.projectFavoritesHooks);
}
