import { drizzleAdapter } from '../../adapters';
import { CommentsService } from './comments.class';
import { commentsHooks } from './comments.hooks';
import { comments } from '../../db/schema';
import { commentsCreateSchema, commentsPatchSchema } from './comments.schema';

export const commentsService = new CommentsService(
    drizzleAdapter,
    comments,
    commentsCreateSchema,
    commentsPatchSchema
);

// Apply hooks
if ((commentsService as any).hooks) {
    (commentsService as any).hooks(commentsHooks);
}


