"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Before hook for `create` on `auth-change-password`.
 *
 * Changes password for the authenticated user.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const changePassword = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
    const { currentPassword, newPassword } = context.data;
    if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
    }
    if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
    }
    const [user] = await adapters_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
    if (!user) {
        throw new Error('User not found');
    }
    if (!user.password) {
        throw new Error('User does not have a password set');
    }
    const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await adapters_1.db.update(schema_1.users).set({ password: hashedPassword, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    context.result = { success: true, message: 'Password changed successfully' };
    return context;
};
exports.changePassword = changePassword;
