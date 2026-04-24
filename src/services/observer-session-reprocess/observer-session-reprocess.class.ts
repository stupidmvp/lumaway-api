import { BaseService, DrizzleAdapter } from '@flex-donec/core';
import { eq } from 'drizzle-orm';
import { observerChapters, observerSessions, observerStepCandidates } from '../../db/schema';
import { observerSessionReprocessSchema, type ObserverSessionReprocessInput } from './observer-session-reprocess.schema';
import { scheduleObserverSessionProcessing } from '../observer-processing/processObserverSession';

export class ObserverSessionReprocessService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async create(data: ObserverSessionReprocessInput, _params?: any): Promise<any> {
        const parsed = observerSessionReprocessSchema.safeParse(data);
        if (!parsed.success) throw new Error('Invalid observer reprocess payload');

        const db = (this.adapter as any).db;
        const { observerSessionId } = parsed.data;

        const [session] = await db
            .select({ id: observerSessions.id, status: observerSessions.status, processingSummary: observerSessions.processingSummary })
            .from(observerSessions)
            .where(eq(observerSessions.id, observerSessionId))
            .limit(1);

        if (!session) throw new Error('Observer session not found');
        if (!session.id) throw new Error('Invalid session id');

        if (session.status === 'recording' || session.status === 'cancelled') {
            throw new Error(`Session cannot be reprocessed from status '${session.status}'`);
        }

        // Clear previous generated artifacts so regeneration always starts clean.
        await db.delete(observerChapters).where(eq(observerChapters.observerSessionId, observerSessionId));
        await db.delete(observerStepCandidates).where(eq(observerStepCandidates.observerSessionId, observerSessionId));

        await db.update(observerSessions).set({
            status: 'uploaded',
            processingSummary: {
                ...(session.processingSummary || {}),
                reprocessRequestedAt: new Date().toISOString(),
                transcript: {
                    status: 'queued',
                    reason: 'reprocess_requested',
                },
                chapterCount: 0,
                stepCandidatesCount: 0,
            },
            updatedAt: new Date(),
        }).where(eq(observerSessions.id, observerSessionId));

        scheduleObserverSessionProcessing(observerSessionId);

        return {
            observerSessionId,
            status: 'queued',
        };
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
