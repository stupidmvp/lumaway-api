"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Before hook for `create` on `auth-reset-password`.
 *
 * Resets password using a token from the reset email.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const resetPassword = async (context) => {
    const { token, newPassword } = context.data;
    if (!token || !newPassword) {
        throw new Error('Token and new password are required');
    }
    if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
    }
    // Verify reset token
    const resetSecret = (process.env.JWT_SECRET || 'default-secret') + '-reset';
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, resetSecret);
    }
    catch {
        throw new Error('Invalid or expired reset token');
    }
    if (decoded.purpose !== 'password-reset') {
        throw new Error('Invalid reset token');
    }
    const [user] = await adapters_1.db.select({ id: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId)).limit(1);
    if (!user) {
        throw new Error('User not found');
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await adapters_1.db.update(schema_1.users).set({ password: hashedPassword, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
    context.result = { success: true, message: 'Password has been reset successfully' };
    return context;
};
exports.resetPassword = resetPassword;
