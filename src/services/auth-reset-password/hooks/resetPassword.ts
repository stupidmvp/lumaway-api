import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Before hook for `create` on `auth-reset-password`.
 *
 * Resets password using a token from the reset email.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const resetPassword = async (context: any) => {
    const { token, newPassword } = context.data;

    if (!token || !newPassword) {
        throw new Error('Token and new password are required');
    }

    if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
    }

    // Verify reset token
    const resetSecret = (process.env.JWT_SECRET || 'default-secret') + '-reset';
    let decoded: { userId: string; email: string; purpose: string };
    try {
        decoded = jwt.verify(token, resetSecret) as any;
    } catch {
        throw new Error('Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password-reset') {
        throw new Error('Invalid reset token');
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!user) {
        throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, user.id));

    context.result = { success: true, message: 'Password has been reset successfully' };
    return context;
};

