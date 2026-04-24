import { BaseService, DrizzleAdapter } from '@flex-donec/core';
import { and, eq } from 'drizzle-orm';
import { apiKeys, observerEvents, observerSessions } from '../../db/schema';
import { clientObserverSessionsSchema, type ClientObserverSessionsInput } from './client-observer-sessions.schema';
import { S3Provider } from '../../providers';
import path from 'path';
import { scheduleObserverSessionProcessing } from '../observer-processing/processObserverSession';
import { patchProcessingSummaryWithIntentMap } from '../observer-processing/intent-map';

export class ClientObserverSessionsService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async create(data: ClientObserverSessionsInput, params?: any): Promise<any> {
        const parsed = clientObserverSessionsSchema.safeParse(data);
        if (!parsed.success) throw new Error('Invalid payload');

        const apiKey = params?.headers?.['x-api-key'] as string | undefined;
        if (!apiKey) throw new Error('Missing API Key');

        const db = (this.adapter as any).db;
        const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
        if (!keyRecord) throw new Error('Invalid API Key');

        const projectId = keyRecord.projectId;
        const { action } = parsed.data;

        if (action === 'start') {
            const [session] = await db.insert(observerSessions).values({
                projectId,
                intent: parsed.data.intent || null,
                status: 'recording',
                startedAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            return {
                observerSessionId: session.id,
                lumenId: session.id,
                status: session.status,
                captureSource: session.captureSource,
                startedAt: session.startedAt,
            };
        }

        if (action === 'signUpload') {
            const filename = parsed.data.filename || 'observer-recording.webm';
            const ext = path.extname(filename) || '.webm';
            const safeFilename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
            const s3Key = `observer-sessions/${projectId}/${safeFilename}`;
            const contentType = ext === '.mp4' ? 'video/mp4' : 'video/webm';
            const s3 = new S3Provider();
            const signed = await s3.signUrl({
                bucket: process.env.AWS_BUCKET_NAME || '',
                s3Key,
                contentType,
            });

            return {
                signedUrl: signed.signedUrl,
                s3Key: signed.s3PathWithoutBucket,
                lumenS3Key: signed.s3PathWithoutBucket,
                headers: signed.headers,
            };
        }

        const observerSessionId = parsed.data.observerSessionId || parsed.data.lumenId;
        if (!observerSessionId) throw new Error('observerSessionId or lumenId is required');

        const [session] = await db
            .select({
                id: observerSessions.id,
                status: observerSessions.status,
                processingSummary: observerSessions.processingSummary,
            })
            .from(observerSessions)
            .where(and(eq(observerSessions.id, observerSessionId), eq(observerSessions.projectId, projectId)))
            .limit(1);

        if (!session) throw new Error('Observer session not found');

        if (action === 'events') {
            const events = parsed.data.events || [];
            if (events.length === 0) throw new Error('events are required');
            if (session.status !== 'recording' && session.status !== 'uploaded') {
                throw new Error(`Cannot ingest events for session in status '${session.status}'`);
            }

            await db.insert(observerEvents).values(events.map((event) => ({
                observerSessionId,
                type: event.type,
                timestampMs: event.timestampMs,
                url: event.url || null,
                targetSelector: event.targetSelector || null,
                label: event.label || null,
                payload: event.payload || {},
            })));

            const nextSummary = patchProcessingSummaryWithIntentMap(session.processingSummary as Record<string, any>, events);
            await db.update(observerSessions).set({
                processingSummary: nextSummary,
                updatedAt: new Date(),
            }).where(eq(observerSessions.id, observerSessionId));

            return {
                observerSessionId,
                lumenId: observerSessionId,
                ingested: events.length,
            };
        }

        if (session.status !== 'recording') {
            throw new Error(`Cannot finalize session in status '${session.status}'`);
        }

        const [updated] = await db.update(observerSessions).set({
            status: 'uploaded',
            videoS3Key: parsed.data.videoS3Key || parsed.data.lumenS3Key || null,
            captureSource: parsed.data.captureSource || 'dom',
            videoDurationMs: parsed.data.videoDurationMs ?? null,
            endedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(observerSessions.id, observerSessionId)).returning();

        scheduleObserverSessionProcessing(updated.id);

        return {
            observerSessionId: updated.id,
            lumenId: updated.id,
            status: updated.status,
            captureSource: updated.captureSource,
            videoS3Key: updated.videoS3Key,
            lumenS3Key: updated.videoS3Key,
        };
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
