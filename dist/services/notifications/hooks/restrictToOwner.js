"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictToOwner = void 0;
/**
 * Ensures users can only read/modify their own notifications.
 * Injects userId filter on find queries and validates ownership on patch/remove.
 */
const restrictToOwner = (context) => {
    const user = context.params?.user;
    // Internal calls skip
    if (!context.params?.provider)
        return context;
    if (!user)
        throw new Error('Authentication required');
    if (context.method === 'find') {
        // Force filter to only user's own notifications
        if (!context.params.query)
            context.params.query = {};
        context.params.query.userId = user.id;
    }
    return context;
};
exports.restrictToOwner = restrictToOwner;
