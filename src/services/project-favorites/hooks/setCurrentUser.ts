/**
 * Injects the authenticated user's ID into the data/query
 * so users can only manage their own favorites.
 */
export const setCurrentUser = async (context: any) => {
    const user = context.params?.user;
    if (!user) return context;

    if (context.data) {
        context.data.userId = user.id;
    }

    return context;
};

