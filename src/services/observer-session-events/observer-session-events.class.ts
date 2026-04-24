import { BaseService, DrizzleAdapter, ServiceParams } from '@flex-donec/core';
import { eq } from 'drizzle-orm';
import { observerEvents, observerSessions } from '../../db/schema';
import { observerSessionEventsBatchSchema, type ObserverSessionEventsBatchInput } from './observer-session-events.schema';
import { patchProcessingSummaryWithIntentMap } from '../observer-processing/intent-map';

export class ObserverSessionEventsService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async create(data: ObserverSessionEventsBatchInput, _params?: ServiceParams): Promise<any> {
        const parsed = observerSessionEventsBatchSchema.safeParse(data);
        if (!parsed.success) {
            throw new Error('Invalid observer events payload');
        }

        const db = (this.adapter as any).db;
        const { observerSessionId, events } = parsed.data;

        const [session] = await db
            .select({
                id: observerSessions.id,
                status: observerSessions.status,
                processingSummary: observerSessions.processingSummary,
            })
            .from(observerSessions)
            .where(eq(observerSessions.id, observerSessionId))
            .limit(1);

        if (!session) {
            throw new Error('Observer session not found');
        }

        if (session.status !== 'recording' && session.status !== 'uploaded') {
            throw new Error(`Cannot ingest events for session in status '${session.status}'`);
        }

        const rows = events.map((event) => ({
            observerSessionId,
            type: event.type,
            timestampMs: event.timestampMs,
            url: event.url || null,
            targetSelector: event.targetSelector || null,
            label: event.label || null,
            payload: event.payload || {},
        }));

        await db.insert(observerEvents).values(rows);

        const nextSummary = patchProcessingSummaryWithIntentMap(session.processingSummary as Record<string, any>, events);
        await db.update(observerSessions).set({
            processingSummary: nextSummary,
            updatedAt: new Date(),
        }).where(eq(observerSessions.id, observerSessionId));

        return {
            observerSessionId,
            ingested: rows.length,
            firstTimestampMs: rows[0]?.timestampMs ?? null,
            lastTimestampMs: rows[rows.length - 1]?.timestampMs ?? null,
        };
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
