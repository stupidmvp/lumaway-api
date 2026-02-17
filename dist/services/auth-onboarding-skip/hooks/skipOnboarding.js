"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipOnboarding = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `auth-onboarding-skip`.
 *
 * Marks onboarding as completed without creating an org.
 * Used by invited users who already have an org.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const skipOnboarding = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
    // Mark onboarding as completed
    const [currentUser] = await adapters_1.db.select({ preferences: schema_1.users.preferences }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
    const currentPrefs = currentUser?.preferences || {};
    await adapters_1.db.update(schema_1.users).set({
        preferences: { ...currentPrefs, onboardingCompleted: true },
    }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    context.result = { onboardingCompleted: true };
    return context;
};
exports.skipOnboarding = skipOnboarding;
