"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentReactionsPatchSchema = exports.commentReactionsCreateSchema = void 0;
const zod_1 = require("zod");
exports.commentReactionsCreateSchema = zod_1.z.object({
    commentId: zod_1.z.string().uuid(),
    emoji: zod_1.z.string().min(1).max(8), // Emoji character(s)
}).passthrough();
// Reactions are immutable — no patch needed, but the framework requires one
exports.commentReactionsPatchSchema = zod_1.z.object({}).passthrough();
