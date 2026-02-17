/**
 * Ensures users can only query/find their own favorites.
 */
export const filterByCurrentUser = async (context: any) => {
    const user = context.params?.user;
    if (!user) return context;

    // Inject userId filter into the query
    if (!context.params.query) context.params.query = {};
    context.params.query.userId = user.id;

    return context;
};

