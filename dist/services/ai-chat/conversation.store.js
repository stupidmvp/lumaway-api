"use strict";
/**
 * In-memory conversation store
 *
 * Stores conversation history per project/user to maintain context across messages
 * without mixing different users in the same project.
 * Each conversation keeps the last 10 messages (5 exchanges).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationStore = void 0;
class ConversationStore {
    constructor() {
        this.conversations = new Map();
        this.MAX_MESSAGES = 10; // Keep last 10 messages (5 exchanges)
        this.TTL = 30 * 60 * 1000; // 30 minutes TTL
    }
    buildKey(projectId, userId, actorSlug, sessionId) {
        const safeUserId = (userId || "anonymous").trim() || "anonymous";
        const safeActorSlug = (actorSlug || "default").trim() || "default";
        const safeSessionId = (sessionId || "default").trim() || "default";
        return `${projectId}:${safeUserId}:${safeActorSlug}:${safeSessionId}`;
    }
    /**
     * Add a message to a project/user conversation
     */
    addMessage(projectId, role, content, options) {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        let conversation = this.conversations.get(key);
        if (!conversation) {
            conversation = {
                key,
                projectId,
                userId: options?.userId || "anonymous",
                actorSlug: options?.actorSlug,
                sessionId: options?.sessionId,
                userName: undefined,
                userTurns: 0,
                messages: [],
                lastActivity: Date.now(),
            };
            this.conversations.set(key, conversation);
        }
        conversation.messages.push({
            role,
            content,
            timestamp: Date.now(),
        });
        if (role === 'user') {
            conversation.userTurns += 1;
        }
        // Keep only last MAX_MESSAGES
        if (conversation.messages.length > this.MAX_MESSAGES) {
            conversation.messages = conversation.messages.slice(-this.MAX_MESSAGES);
        }
        conversation.lastActivity = Date.now();
    }
    getProfile(projectId, options) {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        const conversation = this.conversations.get(key);
        if (!conversation) {
            return { userName: undefined, userTurns: 0 };
        }
        if (Date.now() - conversation.lastActivity > this.TTL) {
            this.conversations.delete(key);
            return { userName: undefined, userTurns: 0 };
        }
        return {
            userName: conversation.userName,
            userTurns: conversation.userTurns || 0,
        };
    }
    setUserName(projectId, userName, options) {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        let conversation = this.conversations.get(key);
        if (!conversation) {
            conversation = {
                key,
                projectId,
                userId: options?.userId || "anonymous",
                actorSlug: options?.actorSlug,
                sessionId: options?.sessionId,
                userName: undefined,
                userTurns: 0,
                messages: [],
                lastActivity: Date.now(),
            };
            this.conversations.set(key, conversation);
        }
        conversation.userName = userName.trim();
        conversation.lastActivity = Date.now();
    }
    /**
     * Get conversation history for a project
     */
    getHistory(projectId, options) {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        const conversation = this.conversations.get(key);
        if (!conversation) {
            return [];
        }
        // Check if conversation has expired
        if (Date.now() - conversation.lastActivity > this.TTL) {
            this.conversations.delete(key);
            return [];
        }
        return conversation.messages;
    }
    /**
     * Format history as string for LLM context
     */
    formatHistory(projectId, options) {
        const messages = this.getHistory(projectId, options);
        if (messages.length === 0) {
            return '';
        }
        const assistantName = options?.assistantName || 'Oriana';
        return messages
            .map(msg => `${msg.role === 'user' ? 'Usuario' : assistantName}: ${msg.content}`)
            .join('\n');
    }
    /**
     * Clear conversation for a project/user scope
     */
    clear(projectId, options) {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        this.conversations.delete(key);
    }
    /**
     * Clean expired conversations (run periodically)
     */
    cleanExpired() {
        const now = Date.now();
        for (const [key, conversation] of this.conversations.entries()) {
            if (now - conversation.lastActivity > this.TTL) {
                this.conversations.delete(key);
            }
        }
    }
}
exports.conversationStore = new ConversationStore();
// Clean expired conversations every 10 minutes
setInterval(() => exports.conversationStore.cleanExpired(), 10 * 60 * 1000);
