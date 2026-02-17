import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { AuthenticationStrategy, DrizzleAdapter } from '@flex-donec/core';
import { users } from '../db/schema';
import type { AuthResult } from '../types';

export class JWTStrategy implements AuthenticationStrategy {
    public readonly name = 'jwt';

    constructor(
        private storage: DrizzleAdapter,
        private jwtSecret: string
    ) { }

    async authenticate(data: { accessToken: string }): Promise<AuthResult> {
        const { accessToken } = data;

        if (!accessToken) {
            throw new Error('Access token is required');
        }

        try {
            const decoded = jwt.verify(accessToken, this.jwtSecret) as { userId: string };

            const db = (this.storage as any).db;
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, decoded.userId))
                .limit(1);

            if (!user) {
                throw new Error('User not found');
            }

            return {
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                },
                permissions: [],
                roles: []
            };
        } catch (err: any) {
            throw new Error('Invalid token');
        }
    }
}
