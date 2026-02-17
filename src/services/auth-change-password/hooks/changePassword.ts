import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Before hook for `create` on `auth-change-password`.
 *
 * Changes password for the authenticated user.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const changePassword = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    const { currentPassword, newPassword } = context.data;

    if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.password) {
        throw new Error('User does not have a password set');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, userId));

    context.result = { success: true, message: 'Password changed successfully' };
    return context;
};

