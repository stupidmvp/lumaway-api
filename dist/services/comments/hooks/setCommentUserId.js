"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCommentUserId = void 0;
/**
 * Automatically sets the userId on comment creation from the authenticated user.
 */
const setCommentUserId = (context) => {
    const user = context.params?.user;
    if (user && context.data) {
        context.data.userId = user.id;
    }
    return context;
};
exports.setCommentUserId = setCommentUserId;
