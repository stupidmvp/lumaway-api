import { drizzleAdapter } from '../../adapters';
import { CommentReactionsService } from './comment-reactions.class';
import { commentReactionsHooks } from './comment-reactions.hooks';
import { commentReactions } from '../../db/schema';
import { commentReactionsCreateSchema, commentReactionsPatchSchema } from './comment-reactions.schema';

export const commentReactionsService = new CommentReactionsService(
    drizzleAdapter,
    commentReactions,
    commentReactionsCreateSchema,
    commentReactionsPatchSchema
);

// Apply hooks
if ((commentReactionsService as any).hooks) {
    (commentReactionsService as any).hooks(commentReactionsHooks);
}

