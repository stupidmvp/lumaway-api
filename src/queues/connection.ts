import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection config for BullMQ queues.
 * Uses BullMQ's own ConnectionOptions type to avoid ioredis version conflicts.
 */
export const redisConnectionOptions: ConnectionOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
};
