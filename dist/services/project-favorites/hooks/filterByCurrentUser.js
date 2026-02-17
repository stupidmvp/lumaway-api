"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByCurrentUser = void 0;
/**
 * Ensures users can only query/find their own favorites.
 */
const filterByCurrentUser = async (context) => {
    const user = context.params?.user;
    if (!user)
        return context;
    // Inject userId filter into the query
    if (!context.params.query)
        context.params.query = {};
    context.params.query.userId = user.id;
    return context;
};
exports.filterByCurrentUser = filterByCurrentUser;
