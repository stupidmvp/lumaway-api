/**
 * Automatically sets the userId on comment creation from the authenticated user.
 */
export const setCommentUserId = (context: any) => {
    const user = context.params?.user;
    if (user && context.data) {
        context.data.userId = user.id;
    }
    return context;
};

