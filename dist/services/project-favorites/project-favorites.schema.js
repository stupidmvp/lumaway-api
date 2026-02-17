"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectFavoritesPatchSchema = exports.projectFavoritesCreateSchema = void 0;
const zod_1 = require("zod");
exports.projectFavoritesCreateSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
});
exports.projectFavoritesPatchSchema = zod_1.z.object({});
