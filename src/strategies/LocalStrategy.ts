import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, SQL } from 'drizzle-orm';
import { AuthenticationStrategy, DrizzleAdapter } from '@flex-donec/core';
import { users } from '../db/schema';
import type { AuthResult } from '../types';

export class LocalStrategy implements AuthenticationStrategy {
    public readonly name = 'local';

    constructor(
        private storage: DrizzleAdapter,
        private jwtSecret: string
    ) { }

    async authenticate(data: any): Promise<AuthResult> {
        const { email, password } = data;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Access the internal db instance
        const db = (this.storage as any).db;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.password) {
            throw new Error('User has no password set');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            this.jwtSecret,
            { expiresIn: '24h' }
        );

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
    }
}
