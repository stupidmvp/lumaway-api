"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentReactionsService = void 0;
const adapters_1 = require("../../adapters");
const comment_reactions_class_1 = require("./comment-reactions.class");
const comment_reactions_hooks_1 = require("./comment-reactions.hooks");
const schema_1 = require("../../db/schema");
const comment_reactions_schema_1 = require("./comment-reactions.schema");
exports.commentReactionsService = new comment_reactions_class_1.CommentReactionsService(adapters_1.drizzleAdapter, schema_1.commentReactions, comment_reactions_schema_1.commentReactionsCreateSchema, comment_reactions_schema_1.commentReactionsPatchSchema);
// Apply hooks
if (exports.commentReactionsService.hooks) {
    exports.commentReactionsService.hooks(comment_reactions_hooks_1.commentReactionsHooks);
}
