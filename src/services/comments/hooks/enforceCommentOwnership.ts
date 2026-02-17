import { db } from '../../../adapters';
import { comments } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { drizzleAdapter } from '../../../adapters';
import { getUserRoles } from '../../../utils/roles';

/**
 * Ensures proper ownership rules for comment modifications:
 *
 * - Content edits: only the comment author can modify content
 * - Archive/delete (status change): comment author OR project owner/editor
 * - Resolve correction: any project editor/owner
 * - Superadmin bypasses all checks
 */
export const enforceCommentOwnership = async (context: any) => {
    const user = context.params?.user;

    // Internal calls skip ownership check
    if (!context.params?.provider) return context;
    if (!user) throw new Error('Authentication required');

    // Superadmin bypasses
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) return context;

    const commentId = (context.id ?? context.params?.route?.id) as string;
    if (!commentId) throw new Error('Comment ID is required');

    const [comment] = await db
        .select({ userId: comments.userId })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

    if (!comment) throw new Error('Comment not found');

    const membership = context.params?.projectMembership;
    const isProjectOwnerOrEditor = membership?.role === 'owner' || membership?.role === 'editor';
    const isCommentAuthor = comment.userId === user.id;

    // Check what operation is being performed
    const patchData = context.data;

    if (context.method === 'remove') {
        // Hard delete (not used in normal flow, but just in case)
        if (!isCommentAuthor && !isProjectOwnerOrEditor) {
            throw new Error('You can only delete your own comments');
        }
        return context;
    }

    // For PATCH operations, determine what's being changed
    if (patchData) {
        const isStatusChange = patchData.status !== undefined;
        const isContentChange = patchData.content !== undefined;
        const isResolveChange = patchData.isResolved !== undefined;
        const isRemoveAttachments = patchData.removeAttachmentIds !== undefined;

        // Content edits: only the author
        if (isContentChange && !isCommentAuthor) {
            throw new Error('You can only edit your own comments');
        }

        // Removing attachments: only the author or project owner/editor
        if (isRemoveAttachments && !isCommentAuthor && !isProjectOwnerOrEditor) {
            throw new Error('You can only remove attachments from your own comments');
        }

        // Status changes (archive/delete/restore): author or project owner/editor
        if (isStatusChange && !isCommentAuthor && !isProjectOwnerOrEditor) {
            throw new Error('Insufficient permissions to change comment status');
        }

        // Resolve correction: any project editor/owner
        if (isResolveChange && !isProjectOwnerOrEditor) {
            throw new Error('Only project editors or owners can resolve corrections');
        }
    }

    return context;
};
