import { db } from '../../../adapters';
import { apiKeys } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { conversationStore } from '../../ai-chat/conversation.store';

/**
 * Before hook for `create` on `ai-chat-reset`.
 *
 * Clears conversation history for a project/user scope.
 */
export const handleReset = async (context: any) => {
    // ── API Key authentication ──────────────────────────────────────────
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;
    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    const keyRows = await db
        .select({ projectId: apiKeys.projectId })
        .from(apiKeys)
        .where(eq(apiKeys.key, apiKey))
        .limit(1);

    const keyRecord = keyRows[0];
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;
    const headers = context.params?.headers || {};
    const userIdHeader = headers['x-luma-user-id'];
    const actorSlugHeader = headers['x-actor-slug'];
    const sessionIdHeader = headers['x-luma-session-id'];
    const userId = typeof userIdHeader === 'string' && userIdHeader.trim() ? userIdHeader.trim() : 'anonymous';
    const actorSlug = typeof actorSlugHeader === 'string' && actorSlugHeader.trim() ? actorSlugHeader.trim() : undefined;
    const sessionId = typeof sessionIdHeader === 'string' && sessionIdHeader.trim() ? sessionIdHeader.trim() : undefined;

    // ── Clear conversation history ──────────────────────────────────────
    await conversationStore.clear(projectId, { userId, actorSlug, sessionId });

    context.result = {
        success: true,
        message: 'Conversation history cleared',
    };

    return context;
};
