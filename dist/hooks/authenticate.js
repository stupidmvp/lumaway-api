"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const adapters_1 = require("../adapters");
const authenticate = async (context) => {
    // If user is already authenticated (e.g. by another hook), skip
    if (context.params.user)
        return context;
    // Check if it's an external provider call (rest/socket)
    if (!context.params.provider)
        return context;
    const authHeader = context.params.headers?.authorization;
    if (!authHeader) {
        // If public access isn't allowed, we should throw. 
        // For now, let's assume we want to enforce auth.
        throw new Error('Authentication required');
    }
    const token = authHeader.split(' ')[1];
    if (!token)
        throw new Error('Authentication required');
    try {
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded.userId)
            throw new Error('Invalid token payload');
        const db = adapters_1.drizzleAdapter.db;
        const [user] = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId)).limit(1);
        if (!user)
            throw new Error('User not found');
        context.params.user = user;
    }
    catch (e) {
        throw new Error('Invalid authentication token');
    }
    return context;
};
exports.authenticate = authenticate;
