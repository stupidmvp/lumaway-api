"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiWorker = exports.aiQueue = void 0;
exports.enqueueAITask = enqueueAITask;
exports.enqueueAIBatch = enqueueAIBatch;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
const ai_1 = require("../adapters/ai");
const zod_1 = require("zod");
// =====================================================
// Queue Definition
// =====================================================
const QUEUE_NAME = 'ai-tasks';
exports.aiQueue = new bullmq_1.Queue(QUEUE_NAME, {
    connection: connection_1.redisConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
    },
});
// =====================================================
// Worker Definition
// =====================================================
const stepSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    selector: zod_1.z.string().optional(),
    action: zod_1.z.string().optional(),
});
const extractStepsSchema = zod_1.z.object({
    steps: zod_1.z.array(stepSchema),
});
async function processAIJob(job) {
    const { taskType, prompt, orgId, projectId, system } = job.data;
    // Resolve LLM based on org subscription + policy
    let llm;
    try {
        llm = await (0, ai_1.resolveLLM)(orgId, projectId);
    }
    catch (err) {
        console.warn(`[AI Worker] LLM resolution failed for org=${orgId}, falling back to free tier:`, err.message);
        llm = ai_1.geminiLLM;
    }
    switch (taskType) {
        case 'enrich-step':
        case 'generate-description': {
            const text = await llm.text(prompt, { system });
            return { text, metadata: job.data.metadata };
        }
        case 'extract-steps': {
            const structured = await llm.structured(prompt, extractStepsSchema, {
                system,
            });
            return { structured, metadata: job.data.metadata };
        }
        default:
            throw new Error(`Unknown AI task type: ${taskType}`);
    }
}
exports.aiWorker = new bullmq_1.Worker(QUEUE_NAME, processAIJob, {
    connection: connection_1.redisConnectionOptions,
    concurrency: 5,
});
// =====================================================
// Event Handlers (Logging)
// =====================================================
exports.aiWorker.on('completed', (job) => {
    if (job) {
        console.log(`[AI Worker] Job ${job.id} (${job.data.taskType}) completed.`);
    }
});
exports.aiWorker.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} failed:`, err.message);
});
// =====================================================
// Helper: Enqueue AI tasks
// =====================================================
/**
 * Enqueue a single AI task.
 */
async function enqueueAITask(data, priority = 1) {
    return exports.aiQueue.add(data.taskType, data, { priority });
}
/**
 * Enqueue multiple AI tasks as a batch.
 */
async function enqueueAIBatch(tasks, priority = 2) {
    const jobs = tasks.map(task => ({
        name: task.taskType,
        data: task,
        opts: { priority },
    }));
    return exports.aiQueue.addBulk(jobs);
}
