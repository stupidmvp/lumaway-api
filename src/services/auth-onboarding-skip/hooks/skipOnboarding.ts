import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `create` on `auth-onboarding-skip`.
 *
 * Marks onboarding as completed without creating an org.
 * Used by invited users who already have an org.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const skipOnboarding = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    // Mark onboarding as completed
    const [currentUser] = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, userId)).limit(1);
    const currentPrefs = (currentUser?.preferences as Record<string, any>) || {};
    await db.update(users).set({
        preferences: { ...currentPrefs, onboardingCompleted: true },
    }).where(eq(users.id, userId));

    context.result = { onboardingCompleted: true };
    return context;
};

