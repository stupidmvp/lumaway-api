/**
 * Extract Authenticated User
 *
 * Helper to verify JWT token from the Authorization header and return the decoded payload.
 */

import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

interface DecodedToken {
    userId: string;
    email: string;
}

/**
 * Extracts the authenticated user from the request.
 * Returns the decoded token payload or null if auth fails (and sends error response).
 */
export function extractAuthUser(req: Request, res: Response): DecodedToken | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Authentication required' });
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return null;
    }

    try {
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret) as DecodedToken;
        return decoded;
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}


