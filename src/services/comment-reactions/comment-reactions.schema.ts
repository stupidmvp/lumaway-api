import { z } from 'zod';

export const commentReactionsCreateSchema = z.object({
    commentId: z.string().uuid(),
    emoji: z.string().min(1).max(8), // Emoji character(s)
}).passthrough();

// Reactions are immutable — no patch needed, but the framework requires one
export const commentReactionsPatchSchema = z.object({}).passthrough();

