import { Queue, Worker, Job } from 'bullmq';
import { redisConnectionOptions } from './connection';
import { resolveLLM, geminiLLM } from '../adapters/ai';
import { z } from 'zod';

// =====================================================
// Job Data Types
// =====================================================

export interface AIJobData {
    taskType: 'enrich-step' | 'generate-description' | 'extract-steps';
    prompt: string;
    orgId: string;             // Required for LLM resolution
    projectId?: string;        // Optional: used in project_delegated policy
    system?: string;
    metadata?: Record<string, any>; // For tracking: walkthroughId, stepIndex, etc.
}

export interface AIJobResult {
    text?: string;
    structured?: any;
    metadata?: Record<string, any>;
}

// =====================================================
// Queue Definition
// =====================================================

const QUEUE_NAME = 'ai-tasks';

export const aiQueue = new Queue(QUEUE_NAME, {
    connection: redisConnectionOptions,
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

const stepSchema = z.object({
    title: z.string(),
    description: z.string(),
    selector: z.string().optional(),
    action: z.string().optional(),
});

const extractStepsSchema = z.object({
    steps: z.array(stepSchema),
});

async function processAIJob(job: Job): Promise<AIJobResult> {
    const { taskType, prompt, orgId, projectId, system } = job.data as AIJobData;

    // Resolve LLM based on org subscription + policy
    let llm;
    try {
        llm = await resolveLLM(orgId, projectId);
    } catch (err) {
        console.warn(`[AI Worker] LLM resolution failed for org=${orgId}, falling back to free tier:`, (err as Error).message);
        llm = geminiLLM;
    }

    switch (taskType) {
        case 'enrich-step':
        case 'generate-description': {
            const text = await llm.text(prompt, { system });
            return { text, metadata: (job.data as AIJobData).metadata };
        }

        case 'extract-steps': {
            const structured = await llm.structured(prompt, extractStepsSchema, {
                system,
            });
            return { structured, metadata: (job.data as AIJobData).metadata };
        }

        default:
            throw new Error(`Unknown AI task type: ${taskType}`);
    }
}

export const aiWorker = new Worker(
    QUEUE_NAME,
    processAIJob,
    {
        connection: redisConnectionOptions,
        concurrency: 5,
    }
);

// =====================================================
// Event Handlers (Logging)
// =====================================================

aiWorker.on('completed', (job) => {
    if (job) {
        console.log(`[AI Worker] Job ${job.id} (${(job.data as AIJobData).taskType}) completed.`);
    }
});

aiWorker.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} failed:`, err.message);
});

// =====================================================
// Helper: Enqueue AI tasks
// =====================================================

/**
 * Enqueue a single AI task.
 */
export async function enqueueAITask(data: AIJobData, priority: number = 1) {
    return aiQueue.add(data.taskType, data, { priority });
}

/**
 * Enqueue multiple AI tasks as a batch.
 */
export async function enqueueAIBatch(tasks: AIJobData[], priority: number = 2) {
    const jobs = tasks.map(task => ({
        name: task.taskType as string,
        data: task as any,
        opts: { priority },
    }));
    return aiQueue.addBulk(jobs);
}
