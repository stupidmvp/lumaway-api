export const setCreateDefaults = async (context: any) => {
    const userId = context.params?.user?.id;
    const now = new Date();

    context.data = {
        ...context.data,
        createdBy: userId || context.data?.createdBy || null,
        status: context.data?.status || 'recording',
        startedAt: context.data?.startedAt || now,
        updatedAt: now,
    };

    return context;
};
