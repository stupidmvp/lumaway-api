"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setReactionUserId = void 0;
/**
 * Before hook on create: injects the authenticated user's ID into the reaction data.
 */
const setReactionUserId = async (context) => {
    const user = context.params?.user;
    if (user) {
        context.data.userId = user.id;
    }
    return context;
};
exports.setReactionUserId = setReactionUserId;
