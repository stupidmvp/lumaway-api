/**
 * Before hook on create: removes the `attachments` array from context.data
 * so it doesn't get passed to the DB insert (attachments are stored in a
 * separate table via the createAttachments after-hook).
 *
 * Preserves the original attachments in context.params._attachments
 * for the after-hook to consume.
 */
export const stripAttachmentsFromData = (context: any) => {
    if (context.data?.attachments) {
        // Stash attachments for the after-hook
        if (!context.params) context.params = {};
        context.params._attachments = context.data.attachments;
        delete context.data.attachments;
    }
    return context;
};


