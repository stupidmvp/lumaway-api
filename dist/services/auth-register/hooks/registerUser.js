"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Before hook for `create` on `auth-register`.
 *
 * Registers a new user account.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const registerUser = async (context) => {
    const { email, password, firstName, lastName } = context.data;
    if (!email) {
        const error = new Error('Email required');
        error.name = 'ValidationError';
        throw error;
    }
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
        hashedPassword = await bcryptjs_1.default.hash(password, 10);
    }
    const existing = await adapters_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
    if (existing.length > 0) {
        const error = new Error('User already exists');
        error.name = 'ValidationError';
        throw error;
    }
    const [user] = await adapters_1.db.insert(schema_1.users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
    }).returning();
    context.result = user;
    return context;
};
exports.registerUser = registerUser;
