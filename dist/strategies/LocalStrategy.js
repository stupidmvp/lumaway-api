"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStrategy = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class LocalStrategy {
    constructor(storage, jwtSecret) {
        this.storage = storage;
        this.jwtSecret = jwtSecret;
        this.name = 'local';
    }
    async authenticate(data) {
        const { email, password } = data;
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        // Access the internal db instance
        const db = this.storage.db;
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (!user.password) {
            throw new Error('User has no password set');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, this.jwtSecret, { expiresIn: '24h' });
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
exports.LocalStrategy = LocalStrategy;
