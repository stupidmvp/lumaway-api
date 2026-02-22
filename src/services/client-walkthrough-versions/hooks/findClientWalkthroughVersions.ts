import { db } from '../../../adapters';
import { apiKeys, walkthroughVersions, walkthroughs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Before hook for `find` on `client-walkthrough-versions`.
 * Validates API Key and returns versions for the specified walkthrough,
 * scoped to the key's project.
 */
export const findClientWalkthroughVersions = async (context: any) => {
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;
    const walkthroughId = context.params?.query?.walkthroughId as string | undefined;

    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    if (!walkthroughId) {
        throw new Error('Missing walkthroughId query parameter');
    }

    // 1. Validate API Key and get projectId
    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);

    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;

    // 2. Verify walkthrough belongs to this project
    const [walkthrough] = await db.select()
        .from(walkthroughs)
        .where(
            and(
                eq(walkthroughs.id, walkthroughId),
                eq(walkthroughs.projectId, projectId)
            )
        )
        .limit(1);

    if (!walkthrough) {
        throw new Error('Walkthrough not found or access denied');
    }

    // 3. Fetch published versions for this walkthrough
    const versions = await db.select()
        .from(walkthroughVersions)
        .where(
            and(
                eq(walkthroughVersions.walkthroughId, walkthroughId),
                eq(walkthroughVersions.isPublished, true)
            )
        );

    context.result = versions;
    return context;
};
