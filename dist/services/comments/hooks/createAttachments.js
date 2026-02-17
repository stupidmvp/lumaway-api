"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttachments = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
/**
 * After hook on create: if the comment payload included `attachments`,
 * create the corresponding comment_attachments records.
 *
 * The `attachments` array is passed in the create data but NOT stored
 * on the comments table — it's intercepted here and stored in the
 * separate comment_attachments table.
 */
const createAttachments = async (context) => {
    const comment = context.result;
    // Attachments were stashed in params by stripAttachmentsFromData before-hook
    const attachments = context.params?._attachments;
    if (!comment || !attachments || !Array.isArray(attachments) || attachments.length === 0) {
        return context;
    }
    const records = attachments.map((att) => ({
        commentId: comment.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        s3Key: att.s3Key,
        uploadedBy: comment.userId,
    }));
    const inserted = await adapters_1.db.insert(schema_1.commentAttachments).values(records).returning();
    // Attach the created records to the result for the response
    comment.attachments = inserted;
    return context;
};
exports.createAttachments = createAttachments;
