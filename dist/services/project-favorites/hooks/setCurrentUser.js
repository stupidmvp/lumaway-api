"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentUser = void 0;
/**
 * Injects the authenticated user's ID into the data/query
 * so users can only manage their own favorites.
 */
const setCurrentUser = async (context) => {
    const user = context.params?.user;
    if (!user)
        return context;
    if (context.data) {
        context.data.userId = user.id;
    }
    return context;
};
exports.setCurrentUser = setCurrentUser;
