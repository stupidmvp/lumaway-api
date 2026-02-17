/**
 * Before hook on create: injects the authenticated user's ID into the reaction data.
 */
export const setReactionUserId = async (context: any) => {
    const user = context.params?.user;
    if (user) {
        context.data.userId = user.id;
    }
    return context;
};

