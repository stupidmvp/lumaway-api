/**
 * Before hook on find: by default, only return active comments.
 * The caller can explicitly pass `status` to see archived or deleted comments.
 */
export const filterActiveComments = (context: any) => {
    if (!context.params) context.params = {};
    if (!context.params.query) context.params.query = {};

    // Only inject default status filter if not explicitly provided
    if (!context.params.query.status) {
        context.params.query.status = 'active';
    }

    return context;
};


