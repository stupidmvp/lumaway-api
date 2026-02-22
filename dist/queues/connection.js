"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = void 0;
/**
 * Redis connection config for BullMQ queues.
 * Uses BullMQ's own ConnectionOptions type to avoid ioredis version conflicts.
 */
exports.redisConnectionOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
};
