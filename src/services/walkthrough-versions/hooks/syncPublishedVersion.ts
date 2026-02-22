import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { walkthroughs } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * After hook for walkthrough-versions.
 * 
 * When a version's status becomes 'published', its title and steps
 * are synchronized to the main 'walkthroughs' table. This ensures
 * that the live content (what the SDK sees) strictly matches the 
 * approved and published version.
 */
export const syncPublishedVersion = async (context: HookContext) => {
    const { result, method } = context;

    // We only care if the version just became published
    if (result && result.status === 'published' && result.walkthroughId) {
        // Only sync if it was a create or if status was explicitly patched to 'published'
        // (In case of patch, we check if result actually has 'published' status)

        await db.update(walkthroughs)
            .set({
                title: result.title,
                steps: result.steps,
                isPublished: true,
                updatedAt: new Date()
            })
            .where(eq(walkthroughs.id, result.walkthroughId));
    }

    return context;
};
