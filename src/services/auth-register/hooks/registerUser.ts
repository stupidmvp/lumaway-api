import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Before hook for `create` on `auth-register`.
 *
 * Registers a new user account.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const registerUser = async (context: any) => {
    const { email, password, firstName, lastName } = context.data;
    if (!email) {
        const error = new Error('Email required');
        error.name = 'ValidationError';
        throw error;
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
        const error = new Error('User already exists');
        error.name = 'ValidationError';
        throw error;
    }

    const [user] = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
    }).returning();

    context.result = user;
    return context;
};

