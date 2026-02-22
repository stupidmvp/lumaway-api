"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReset = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const conversation_store_1 = require("../../ai-chat/conversation.store");
/**
 * Before hook for `create` on `ai-chat-reset`.
 *
 * Clears conversation history for a project/user scope.
 */
const handleReset = async (context) => {
    // ── API Key authentication ──────────────────────────────────────────
    const apiKey = context.params?.headers?.['x-api-key'];
    if (!apiKey) {
        throw new Error('Missing API Key');
    }
    const keyRows = await adapters_1.db
        .select({ projectId: schema_1.apiKeys.projectId })
        .from(schema_1.apiKeys)
        .where((0, drizzle_orm_1.eq)(schema_1.apiKeys.key, apiKey))
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
    conversation_store_1.conversationStore.clear(projectId, { userId, actorSlug, sessionId });
    context.result = {
        success: true,
        message: 'Conversation history cleared',
    };
    return context;
};
exports.handleReset = handleReset;
