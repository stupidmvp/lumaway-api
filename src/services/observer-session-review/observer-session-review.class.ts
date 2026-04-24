import { BaseService, DrizzleAdapter } from '@flex-donec/core';
import { asc, eq } from 'drizzle-orm';
import { observerChapters, observerSessions, observerStepCandidates } from '../../db/schema';
import { S3Provider } from '../../providers';

export class ObserverSessionReviewService extends BaseService<any> {
    private adapter: DrizzleAdapter;
    private s3: S3Provider;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
        this.s3 = new S3Provider();
    }

    async find(params?: any): Promise<any> {
        // Some BaseService routes pass query as `params` directly (not in `params.query`).
        const q = params?.query || params || {};
        const observerSessionId =
            (q.observerSessionId as string | undefined) ||
            (q.observer_session_id as string | undefined) ||
            (q.observersessionid as string | undefined);
        if (!observerSessionId) {
            throw new Error('observerSessionId is required');
        }

        const db = (this.adapter as any).db;
        const [session] = await db
            .select()
            .from(observerSessions)
            .where(eq(observerSessions.id, observerSessionId))
            .limit(1);

        if (!session) {
            throw new Error('Observer session not found');
        }

        const chapters = await db
            .select()
            .from(observerChapters)
            .where(eq(observerChapters.observerSessionId, observerSessionId))
            .orderBy(asc(observerChapters.startMs));

        const stepCandidates = await db
            .select()
            .from(observerStepCandidates)
            .where(eq(observerStepCandidates.observerSessionId, observerSessionId))
            .orderBy(asc(observerStepCandidates.order));

        let videoUrl: string | null = null;
        if (session.videoS3Key) {
            try {
                videoUrl = await this.s3.getSignedDownloadUrl(session.videoS3Key);
            } catch {
                videoUrl = null;
            }
        }

        return {
            session,
            chapters,
            stepCandidates,
            videoUrl,
        };
    }

    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
