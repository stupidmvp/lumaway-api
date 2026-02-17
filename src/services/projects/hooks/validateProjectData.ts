export const validateProjectData = (context: any) => {
    const { data } = context;
    if (!data.organizationId) {
        throw new Error('Organization ID is required to create a project.');
    }
    return context;
};
