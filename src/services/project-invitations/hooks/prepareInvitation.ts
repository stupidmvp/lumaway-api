import crypto from 'crypto';

/**
 * Before create: generates a unique token and sets expiration (7 days).
 * Also sets the invitedBy from the authenticated user.
 */
export const prepareInvitation = (context: any) => {
    const user = context.params?.user;
    if (!context.data) return context;

    // Generate a secure random token
    context.data.token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    context.data.expiresAt = expiresAt;

    // Set who invited
    if (user) {
        context.data.invitedBy = user.id;
    }

    // Normalize email to lowercase
    context.data.email = context.data.email?.toLowerCase().trim();

    return context;
};


