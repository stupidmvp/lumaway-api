"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsService = void 0;
const adapters_1 = require("../../adapters");
const comments_class_1 = require("./comments.class");
const comments_hooks_1 = require("./comments.hooks");
const schema_1 = require("../../db/schema");
const comments_schema_1 = require("./comments.schema");
exports.commentsService = new comments_class_1.CommentsService(adapters_1.drizzleAdapter, schema_1.comments, comments_schema_1.commentsCreateSchema, comments_schema_1.commentsPatchSchema);
// Apply hooks
if (exports.commentsService.hooks) {
    exports.commentsService.hooks(comments_hooks_1.commentsHooks);
}
