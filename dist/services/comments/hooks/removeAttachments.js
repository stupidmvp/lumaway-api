"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAttachments = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook on patch: if the payload includes `removeAttachmentIds`,
 * delete those attachment records from the `comment_attachments` table.
 *
 * Only allows removing attachments that belong to the comment being patched.
 * Strips `removeAttachmentIds` from the data so it's not passed to the DB update.
 */
const removeAttachments = async (context) => {
    const patchData = context.data;
    if (!patchData?.removeAttachmentIds || !Array.isArray(patchData.removeAttachmentIds)) {
        return context;
    }
    const commentId = (context.id ?? context.params?.route?.id);
    const attachmentIds = patchData.removeAttachmentIds;
    if (attachmentIds.length > 0 && commentId) {
        // Only delete attachments that belong to this specific comment
        await adapters_1.db.delete(schema_1.commentAttachments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.commentAttachments.commentId, commentId), (0, drizzle_orm_1.inArray)(schema_1.commentAttachments.id, attachmentIds)));
    }
    // Strip from data so Drizzle doesn't try to write it to the comments table
    delete patchData.removeAttachmentIds;
    return context;
};
exports.removeAttachments = removeAttachments;
