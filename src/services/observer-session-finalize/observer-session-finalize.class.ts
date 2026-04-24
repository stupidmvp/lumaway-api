import { BaseService, DrizzleAdapter, ServiceParams } from '@flex-donec/core';
import { and, eq } from 'drizzle-orm';
import { observerSessions } from '../../db/schema';
import { observerSessionFinalizeSchema, type ObserverSessionFinalizeInput } from './observer-session-finalize.schema';
import { scheduleObserverSessionProcessing } from '../observer-processing/processObserverSession';

export class ObserverSessionFinalizeService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async create(data: ObserverSessionFinalizeInput, _params?: ServiceParams): Promise<any> {
        const parsed = observerSessionFinalizeSchema.safeParse(data);
        if (!parsed.success) {
            throw new Error('Invalid observer finalize payload');
        }

        const { observerSessionId, videoS3Key, videoDurationMs, endedAt } = parsed.data;
        const db = (this.adapter as any).db;

        const [session] = await db
            .select({ id: observerSessions.id, status: observerSessions.status })
            .from(observerSessions)
            .where(eq(observerSessions.id, observerSessionId))
            .limit(1);

        if (!session) {
            throw new Error('Observer session not found');
        }

        if (session.status !== 'recording') {
            throw new Error(`Cannot finalize session in status '${session.status}'`);
        }

        const [updated] = await db
            .update(observerSessions)
            .set({
                status: 'uploaded',
                videoS3Key: videoS3Key || null,
                videoDurationMs: videoDurationMs ?? null,
                endedAt: endedAt || new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(observerSessions.id, observerSessionId), eq(observerSessions.status, 'recording')))
            .returning();

        if (!updated) {
            throw new Error('Session finalize conflict, please retry');
        }

        scheduleObserverSessionProcessing(updated.id);

        return {
            id: updated.id,
            status: updated.status,
            videoS3Key: updated.videoS3Key,
            videoDurationMs: updated.videoDurationMs,
            endedAt: updated.endedAt,
        };
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
