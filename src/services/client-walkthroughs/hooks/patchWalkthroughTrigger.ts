import { db } from '../../../adapters';
import { apiKeys, walkthroughs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Before hook for `patch` on `client-walkthroughs`.
 * 
 * Allows updating specific configuration fields via API Key.
 * Fields allowed: trigger, executionMode, repeatable.
 */
export const patchWalkthroughTrigger = async (context: any) => {
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;
    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    const { id, data } = context;
    if (!id) {
        throw new Error('Missing walkthrough ID');
    }

    // Validate API Key and get projectId
    const keyRecords = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];

    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;

    // Verify walkthrough exists and belongs to this project
    const walkthroughRecords = await db.select()
        .from(walkthroughs)
        .where(
            and(
                eq(walkthroughs.id, id),
                eq(walkthroughs.projectId, projectId)
            )
        )
        .limit(1);

    const walkthrough = walkthroughRecords[0];
    if (!walkthrough) {
        throw new Error('Walkthrough not found or access denied');
    }

    // Allowed fields for patching via client API
    const patchData: any = {};
    if (data.trigger !== undefined) patchData.trigger = data.trigger;
    if (data.executionMode !== undefined) patchData.executionMode = data.executionMode;
    if (data.repeatable !== undefined) patchData.repeatable = data.repeatable;

    if (Object.keys(patchData).length === 0) {
        throw new Error('No valid fields provided for update');
    }

    // Perform update
    const [updated] = await db.update(walkthroughs)
        .set(patchData)
        .where(eq(walkthroughs.id, id))
        .returning();

    context.result = updated;
    return context;
};
