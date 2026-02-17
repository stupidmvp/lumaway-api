"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchCurrentUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `me`.
 *
 * Updates the current user's profile.
 * The `id` parameter is ignored; the authenticated user is always the target.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchCurrentUser = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
    const data = context.data;
    const { firstName, lastName, avatar, preferences } = data;
    const updateData = {};
    if (firstName !== undefined)
        updateData.firstName = firstName;
    if (lastName !== undefined)
        updateData.lastName = lastName;
    if (avatar !== undefined)
        updateData.avatar = avatar;
    // Deep-merge preferences
    if (preferences !== undefined && typeof preferences === 'object') {
        const { userPreferencesSchema } = await Promise.resolve().then(() => __importStar(require('../../users/users.schema')));
        const parsed = userPreferencesSchema.safeParse(preferences);
        if (!parsed.success) {
            const error = new Error('Invalid preferences');
            error.name = 'ValidationError';
            error.details = parsed.error.flatten();
            throw error;
        }
        const [currentUser] = await adapters_1.db
            .select({ preferences: schema_1.users.preferences })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id))
            .limit(1);
        const existingPrefs = currentUser?.preferences || {};
        updateData.preferences = { ...existingPrefs, ...parsed.data };
    }
    const [updated] = await adapters_1.db
        .update(schema_1.users)
        .set({ ...updateData, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id))
        .returning();
    // Return without password
    const { password: _, ...safeUser } = updated;
    context.result = safeUser;
    return context;
};
exports.patchCurrentUser = patchCurrentUser;
