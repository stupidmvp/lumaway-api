import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../providers/email/emailProvider';

/**
 * Before hook for `create` on `auth-forgot-password`.
 *
 * Sends a password reset email.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const sendResetEmail = async (context: any) => {
    const { email } = context.data;

    if (!email) {
        throw new Error('Email is required');
    }

    const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
        context.result = { success: true, message: 'If this email exists, a reset link has been sent.' };
        return context;
    }

    // Generate reset token (1 hour expiry)
    const resetSecret = (process.env.JWT_SECRET || 'default-secret') + '-reset';
    const resetToken = jwt.sign(
        { userId: user.id, email: user.email, purpose: 'password-reset' },
        resetSecret,
        { expiresIn: '1h' }
    );

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail({
        to: user.email,
        subject: 'Reset your password – LumaWay',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset your password</h2>
                <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
                    We received a request to reset your password. Click the button below to set a new password.
                    This link will expire in 1 hour.
                </p>
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #fb64b6, #7c86ff); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    Reset Password
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">
                    If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>
        `,
        text: `Reset your password by visiting: ${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
    });

    context.result = { success: true, message: 'If this email exists, a reset link has been sent.' };
    return context;
};

