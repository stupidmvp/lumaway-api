import { db } from '../../../adapters';
import { commentAttachments } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Before hook on patch: if the payload includes `removeAttachmentIds`,
 * delete those attachment records from the `comment_attachments` table.
 *
 * Only allows removing attachments that belong to the comment being patched.
 * Strips `removeAttachmentIds` from the data so it's not passed to the DB update.
 */
export const removeAttachments = async (context: any) => {
    const patchData = context.data;
    if (!patchData?.removeAttachmentIds || !Array.isArray(patchData.removeAttachmentIds)) {
        return context;
    }

    const commentId = (context.id ?? context.params?.route?.id) as string;
    const attachmentIds: string[] = patchData.removeAttachmentIds;

    if (attachmentIds.length > 0 && commentId) {
        // Only delete attachments that belong to this specific comment
        await db.delete(commentAttachments).where(
            and(
                eq(commentAttachments.commentId, commentId),
                inArray(commentAttachments.id, attachmentIds),
            ),
        );
    }

    // Strip from data so Drizzle doesn't try to write it to the comments table
    delete patchData.removeAttachmentIds;

    return context;
};


