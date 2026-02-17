"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTStrategy = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class JWTStrategy {
    constructor(storage, jwtSecret) {
        this.storage = storage;
        this.jwtSecret = jwtSecret;
        this.name = 'jwt';
    }
    async authenticate(data) {
        const { accessToken } = data;
        if (!accessToken) {
            throw new Error('Access token is required');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(accessToken, this.jwtSecret);
            const db = this.storage.db;
            const [user] = await db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId))
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
        }
        catch (err) {
            throw new Error('Invalid token');
        }
    }
}
exports.JWTStrategy = JWTStrategy;
