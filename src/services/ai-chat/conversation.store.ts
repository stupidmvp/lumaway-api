/**
 * Conversation store with Redis persistence + in-memory fallback.
 *
 * Source of truth is Redis when available; memory keeps hot data and fallback
 * behavior when Redis is unavailable.
 */

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface Conversation {
    key: string;
    projectId: string;
    userId: string;
    actorSlug?: string;
    sessionId?: string;
    userName?: string;
    userTurns: number;
    messages: Message[];
    lastActivity: number;
}

class ConversationStore {
    private conversations = new Map<string, Conversation>();
    private readonly MAX_MESSAGES = 24; // Keep last 24 messages (12 exchanges)
    private readonly TTL = 2 * 60 * 60 * 1000; // 2 hours TTL
    private redisClient: any | null = null;
    private redisReady = false;
    private redisInitAttempted = false;
    private redisDisabled = String(process.env.REDIS_HISTORY_DISABLED || '').toLowerCase() === 'true';

    private buildKey(projectId: string, userId?: string, actorSlug?: string, sessionId?: string): string {
        const safeUserId = (userId || "anonymous").trim() || "anonymous";
        const safeActorSlug = (actorSlug || "default").trim() || "default";
        const safeSessionId = (sessionId || "default").trim() || "default";
        return `${projectId}:${safeUserId}:${safeActorSlug}:${safeSessionId}`;
    }

    private buildRedisKey(scopeKey: string): string {
        return `luma:conversation:${scopeKey}`;
    }

    private ttlSeconds(): number {
        return Math.floor(this.TTL / 1000);
    }

    private async initRedisIfNeeded(): Promise<void> {
        if (this.redisDisabled || this.redisInitAttempted) return;
        this.redisInitAttempted = true;
        try {
            const dynamicImport = new Function('m', 'return import(m)');
            const mod: any = await (dynamicImport as any)('ioredis');
            const RedisCtor = mod?.default || mod?.Redis || mod;
            this.redisClient = new RedisCtor({
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                maxRetriesPerRequest: 1,
                lazyConnect: true,
            });
            if (typeof this.redisClient.connect === 'function') {
                await this.redisClient.connect();
            }
            this.redisReady = true;
            this.redisClient.on?.('error', () => {
                this.redisReady = false;
            });
            this.redisClient.on?.('ready', () => {
                this.redisReady = true;
            });
            console.log('[ConversationStore] Redis history enabled');
        } catch (error: any) {
            this.redisReady = false;
            this.redisClient = null;
            console.warn('[ConversationStore] Redis unavailable, using memory fallback:', error?.message || error);
        }
    }

    private async readFromRedis(key: string): Promise<Conversation | null> {
        await this.initRedisIfNeeded();
        if (!this.redisReady || !this.redisClient) return null;
        try {
            const raw = await this.redisClient.get(this.buildRedisKey(key));
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Conversation;
            return parsed;
        } catch {
            return null;
        }
    }

    private async writeToRedis(conversation: Conversation): Promise<void> {
        await this.initRedisIfNeeded();
        if (!this.redisReady || !this.redisClient) return;
        try {
            await this.redisClient.set(
                this.buildRedisKey(conversation.key),
                JSON.stringify(conversation),
                'EX',
                this.ttlSeconds()
            );
        } catch {
            // ignore Redis write failures; memory still holds active state
        }
    }

    private async deleteFromRedis(key: string): Promise<void> {
        await this.initRedisIfNeeded();
        if (!this.redisReady || !this.redisClient) return;
        try {
            await this.redisClient.del(this.buildRedisKey(key));
        } catch {
            // ignore
        }
    }

    private async getConversation(
        projectId: string,
        options?: { userId?: string; actorSlug?: string; sessionId?: string }
    ): Promise<Conversation | null> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        const local = this.conversations.get(key);
        if (local) {
            if (Date.now() - local.lastActivity > this.TTL) {
                this.conversations.delete(key);
                await this.deleteFromRedis(key);
                return null;
            }
            return local;
        }

        const fromRedis = await this.readFromRedis(key);
        if (!fromRedis) return null;
        if (Date.now() - fromRedis.lastActivity > this.TTL) {
            await this.deleteFromRedis(key);
            return null;
        }
        this.conversations.set(key, fromRedis);
        return fromRedis;
    }

    /**
     * Add a message to a project/user conversation
     */
    async addMessage(
        projectId: string,
        role: 'user' | 'assistant',
        content: string,
        options?: { userId?: string; actorSlug?: string; sessionId?: string }
    ): Promise<void> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        let conversation = await this.getConversation(projectId, options);

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
        await this.writeToRedis(conversation);
    }

    async getProfile(projectId: string, options?: { userId?: string; actorSlug?: string; sessionId?: string }): Promise<{ userName?: string; userTurns: number }> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        const conversation = await this.getConversation(projectId, options);
        if (!conversation) {
            return { userName: undefined, userTurns: 0 };
        }
        if (Date.now() - conversation.lastActivity > this.TTL) {
            this.conversations.delete(key);
            await this.deleteFromRedis(key);
            return { userName: undefined, userTurns: 0 };
        }
        return {
            userName: conversation.userName,
            userTurns: conversation.userTurns || 0,
        };
    }

    async setUserName(projectId: string, userName: string, options?: { userId?: string; actorSlug?: string; sessionId?: string }): Promise<void> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        let conversation = await this.getConversation(projectId, options);
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
        await this.writeToRedis(conversation);
    }

    /**
     * Get conversation history for a project
     */
    async getHistory(projectId: string, options?: { userId?: string; actorSlug?: string; sessionId?: string }): Promise<Message[]> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        const conversation = await this.getConversation(projectId, options);

        if (!conversation) {
            return [];
        }

        // Check if conversation has expired
        if (Date.now() - conversation.lastActivity > this.TTL) {
            this.conversations.delete(key);
            await this.deleteFromRedis(key);
            return [];
        }

        return conversation.messages;
    }

    /**
     * Format history as string for LLM context
     */
    async formatHistory(
        projectId: string,
        options?: { userId?: string; actorSlug?: string; sessionId?: string; assistantName?: string }
    ): Promise<string> {
        const messages = await this.getHistory(projectId, options);

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
    async clear(projectId: string, options?: { userId?: string; actorSlug?: string; sessionId?: string }): Promise<void> {
        const key = this.buildKey(projectId, options?.userId, options?.actorSlug, options?.sessionId);
        this.conversations.delete(key);
        await this.deleteFromRedis(key);
    }

    /**
     * Clean expired conversations (run periodically)
     */
    cleanExpired(): void {
        const now = Date.now();
        for (const [key, conversation] of this.conversations.entries()) {
            if (now - conversation.lastActivity > this.TTL) {
                this.conversations.delete(key);
            }
        }
    }
}

export const conversationStore = new ConversationStore();

// Clean expired conversations every 10 minutes
setInterval(() => conversationStore.cleanExpired(), 10 * 60 * 1000);
