"use strict";
/**
 * Extract Authenticated User
 *
 * Helper to verify JWT token from the Authorization header and return the decoded payload.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAuthUser = extractAuthUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Extracts the authenticated user from the request.
 * Returns the decoded token payload or null if auth fails (and sends error response).
 */
function extractAuthUser(req, res) {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}
