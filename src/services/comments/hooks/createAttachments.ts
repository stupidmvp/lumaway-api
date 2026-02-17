import { db } from '../../../adapters';
import { commentAttachments } from '../../../db/schema';

/**
 * After hook on create: if the comment payload included `attachments`,
 * create the corresponding comment_attachments records.
 *
 * The `attachments` array is passed in the create data but NOT stored
 * on the comments table — it's intercepted here and stored in the
 * separate comment_attachments table.
 */
export const createAttachments = async (context: any) => {
    const comment = context.result;
    // Attachments were stashed in params by stripAttachmentsFromData before-hook
    const attachments = context.params?._attachments;

    if (!comment || !attachments || !Array.isArray(attachments) || attachments.length === 0) {
        return context;
    }

    const records = attachments.map((att: any) => ({
        commentId: comment.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        s3Key: att.s3Key,
        uploadedBy: comment.userId,
    }));

    const inserted = await db.insert(commentAttachments).values(records).returning();

    // Attach the created records to the result for the response
    comment.attachments = inserted;

    return context;
};

