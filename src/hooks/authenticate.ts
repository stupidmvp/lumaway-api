import jwt from 'jsonwebtoken';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { drizzleAdapter } from '../adapters';

export const authenticate = async (context: any) => {
    // If user is already authenticated (e.g. by another hook), skip
    if (context.params.user) return context;

    // Check if it's an external provider call (rest/socket)
    if (!context.params.provider) return context;

    const authHeader = context.params.headers?.authorization;
    if (!authHeader) {
        // If public access isn't allowed, we should throw. 
        // For now, let's assume we want to enforce auth.
        throw new Error('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Authentication required');

    try {
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret) as any;

        if (!decoded.userId) throw new Error('Invalid token payload');

        const db = (drizzleAdapter as any).db;
        const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

        if (!user) throw new Error('User not found');

        context.params.user = user;
    } catch (e) {
        throw new Error('Invalid authentication token');
    }

    return context;
};
