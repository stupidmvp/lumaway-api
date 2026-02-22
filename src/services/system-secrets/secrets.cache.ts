import { eq, and } from 'drizzle-orm';
import { db } from '../../adapters';
import { systemSecrets } from '../../db/schema';

/**
 * SecretsService - In-memory cache layer for system secrets.
 * Retrieves API keys from the database and caches them with a configurable TTL.
 */
export class SecretsService {
    private cache: Map<string, { value: string; expiresAt: number }> = new Map();
    private ttlMs: number;

    constructor(ttlMs: number = 5 * 60 * 1000) { // Default: 5 minutes
        this.ttlMs = ttlMs;
    }

    /**
     * Get a secret by key name. Returns from cache if still valid, otherwise fetches from DB.
     */
    async get(keyName: string): Promise<string> {
        // Check cache first
        const cached = this.cache.get(keyName);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.value;
        }

        // Fetch from DB
        const result = await db
            .select()
            .from(systemSecrets)
            .where(and(
                eq(systemSecrets.keyName, keyName),
                eq(systemSecrets.isActive, true)
            ))
            .limit(1);

        if (!result.length) {
            throw new Error(`Secret "${keyName}" not found or is inactive.`);
        }

        const secret = result[0];

        // Cache the result
        this.cache.set(keyName, {
            value: secret.keyValue,
            expiresAt: Date.now() + this.ttlMs,
        });

        return secret.keyValue;
    }

    /**
     * Get all active secrets for a given provider.
     */
    async getByProvider(provider: 'google' | 'groq'): Promise<{ keyName: string; keyValue: string }[]> {
        const results = await db
            .select()
            .from(systemSecrets)
            .where(and(
                eq(systemSecrets.provider, provider),
                eq(systemSecrets.isActive, true)
            ));

        return results.map(r => ({ keyName: r.keyName, keyValue: r.keyValue }));
    }

    /**
     * Invalidate a specific cached secret (useful after SuperAdmin updates a key).
     */
    invalidate(keyName: string): void {
        this.cache.delete(keyName);
    }

    /**
     * Invalidate the entire cache.
     */
    invalidateAll(): void {
        this.cache.clear();
    }
}

// Singleton instance
export const secretsService = new SecretsService();
