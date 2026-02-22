"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretsService = exports.SecretsService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const adapters_1 = require("../../adapters");
const schema_1 = require("../../db/schema");
/**
 * SecretsService - In-memory cache layer for system secrets.
 * Retrieves API keys from the database and caches them with a configurable TTL.
 */
class SecretsService {
    constructor(ttlMs = 5 * 60 * 1000) {
        this.cache = new Map();
        this.ttlMs = ttlMs;
    }
    /**
     * Get a secret by key name. Returns from cache if still valid, otherwise fetches from DB.
     */
    async get(keyName) {
        // Check cache first
        const cached = this.cache.get(keyName);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.value;
        }
        // Fetch from DB
        const result = await adapters_1.db
            .select()
            .from(schema_1.systemSecrets)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.systemSecrets.keyName, keyName), (0, drizzle_orm_1.eq)(schema_1.systemSecrets.isActive, true)))
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
    async getByProvider(provider) {
        const results = await adapters_1.db
            .select()
            .from(schema_1.systemSecrets)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.systemSecrets.provider, provider), (0, drizzle_orm_1.eq)(schema_1.systemSecrets.isActive, true)));
        return results.map(r => ({ keyName: r.keyName, keyValue: r.keyValue }));
    }
    /**
     * Invalidate a specific cached secret (useful after SuperAdmin updates a key).
     */
    invalidate(keyName) {
        this.cache.delete(keyName);
    }
    /**
     * Invalidate the entire cache.
     */
    invalidateAll() {
        this.cache.clear();
    }
}
exports.SecretsService = SecretsService;
// Singleton instance
exports.secretsService = new SecretsService();
