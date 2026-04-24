export type ObserverTranscriptSegment = {
    startMs: number;
    endMs: number;
    text: string;
};

export type ObserverTranscriptPayload = {
    transcriptText: string;
    segments: ObserverTranscriptSegment[];
    provider: string;
    model: string;
};

export type ObserverTranscriptionStatus = {
    status: 'ok' | 'skipped' | 'failed';
    reason?: string;
    details?: string;
    source?: 'project' | 'organization' | 'env' | 'local';
};

export type ObserverTranscriptionResult = {
    transcript: ObserverTranscriptPayload | null;
    status: ObserverTranscriptionStatus;
};

export type ObserverTranscriptionInput = {
    projectId: string;
    videoS3Key: string | null | undefined;
};
