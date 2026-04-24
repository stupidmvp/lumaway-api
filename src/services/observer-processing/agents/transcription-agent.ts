import { S3Provider } from '../../../providers';
import { resolveProviderApiKeyForProject } from '../../../adapters/ai/llm-resolver';
import type {
    ObserverTranscriptPayload,
    ObserverTranscriptionInput,
    ObserverTranscriptionResult,
} from './types';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

function inferMimeTypeFromKey(key: string): string {
    const normalized = key.toLowerCase();
    if (normalized.endsWith('.mp4')) return 'video/mp4';
    if (normalized.endsWith('.m4a')) return 'audio/mp4';
    if (normalized.endsWith('.mp3')) return 'audio/mpeg';
    if (normalized.endsWith('.wav')) return 'audio/wav';
    return 'video/webm';
}

type DownloadedMedia = {
    videoS3Key: string;
    filename: string;
    mediaBuffer: ArrayBuffer;
};

async function downloadSessionMedia(videoS3Key: string): Promise<DownloadedMedia> {
    const s3 = new S3Provider();
    const signedUrl = await s3.getSignedDownloadUrl(videoS3Key);
    const mediaResponse = await fetch(signedUrl);
    if (!mediaResponse.ok) {
        throw new Error(`Unable to download lumen media for transcription (${mediaResponse.status})`);
    }

    return {
        videoS3Key,
        filename: videoS3Key.split('/').pop() || `lumen-recording-${randomUUID()}.webm`,
        mediaBuffer: await mediaResponse.arrayBuffer(),
    };
}

type TranscribeStrategy = 'local_only' | 'local_first' | 'openai_only';

function resolveBinaryPath(envValue: string | undefined, candidates: string[], binaryName: string): string {
    if (envValue && envValue.trim()) return envValue.trim();
    const found = candidates.find((path) => existsSync(path));
    return found || binaryName;
}

export class ObserverTranscriptionAgent {
    async run(input: ObserverTranscriptionInput): Promise<ObserverTranscriptionResult> {
        if (!input.videoS3Key) {
            return {
                transcript: null,
                status: { status: 'skipped', reason: 'missing_video_s3_key' },
            };
        }

        const strategy = (process.env.LUMEN_TRANSCRIBE_STRATEGY || 'local_only') as TranscribeStrategy;
        let localError: Error | null = null;
        try {
            const media = await downloadSessionMedia(input.videoS3Key);

            if (strategy !== 'openai_only') {
                try {
                    const localTranscript = await this.transcribeWithLocalWhisper(media);
                    return {
                        transcript: localTranscript,
                        status: {
                            status: 'ok',
                            source: 'local',
                        },
                    };
                } catch (error) {
                    localError = error as Error;
                    if (strategy === 'local_only') {
                        return {
                            transcript: null,
                            status: {
                                status: 'failed',
                                reason: 'local_transcription_error',
                                details: localError.message,
                            },
                        };
                    }
                }
            }

            const providerConfig = await resolveProviderApiKeyForProject(input.projectId, 'openai');
            const apiKey = providerConfig?.apiKey;
            if (!apiKey) {
                return {
                    transcript: null,
                    status: {
                        status: 'skipped',
                        reason: 'missing_openai_provider_key',
                        details: localError?.message,
                    },
                };
            }

            const transcript = await this.transcribeWithOpenAi(media, apiKey, providerConfig?.modelId);
            return {
                transcript,
                status: {
                    status: 'ok',
                    source: providerConfig?.source,
                },
            };
        } catch (error) {
            return {
                transcript: null,
                status: {
                    status: 'failed',
                    reason: 'transcription_error',
                    details: localError
                        ? `Local error: ${localError.message} | Fallback error: ${(error as Error)?.message || 'unknown transcription error'}`
                        : ((error as Error)?.message || 'unknown transcription error'),
                },
            };
        }
    }

    private async transcribeWithLocalWhisper(media: DownloadedMedia): Promise<ObserverTranscriptPayload> {
        const ffmpegBin = resolveBinaryPath(
            process.env.FFMPEG_BIN,
            ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'],
            'ffmpeg'
        );
        const whisperBin = resolveBinaryPath(
            process.env.WHISPER_BIN,
            ['/opt/homebrew/bin/whisper', '/usr/local/bin/whisper'],
            'whisper'
        );
        const whisperModel = process.env.LUMEN_LOCAL_WHISPER_MODEL || 'small';
        const language = process.env.LUMEN_LOCAL_WHISPER_LANGUAGE || 'auto';

        const workDir = await mkdtemp(join(tmpdir(), 'lumen-transcribe-'));
        const inputPath = join(workDir, media.filename);
        const audioPath = join(workDir, `${basename(media.filename).replace(/\.[^.]+$/, '')}.wav`);

        try {
            await writeFile(inputPath, Buffer.from(media.mediaBuffer));

            await execFileAsync(ffmpegBin, [
                '-y',
                '-i',
                inputPath,
                '-vn',
                '-ac',
                '1',
                '-ar',
                '16000',
                '-f',
                'wav',
                audioPath,
            ]);

            const whisperArgs = [
                audioPath,
                '--model',
                whisperModel,
                '--output_format',
                'json',
                '--output_dir',
                workDir,
            ];
            if (language !== 'auto') {
                whisperArgs.push('--language', language);
            }

            await execFileAsync(whisperBin, whisperArgs);

            const jsonOutputPath = join(workDir, `${basename(audioPath).replace(/\.[^.]+$/, '')}.json`);
            const raw = await readFile(jsonOutputPath, 'utf-8');
            const payload = JSON.parse(raw);
            const segments = Array.isArray(payload?.segments)
                ? payload.segments
                    .map((segment: any) => ({
                        startMs: Math.max(0, Math.round(Number(segment?.start || 0) * 1000)),
                        endMs: Math.max(0, Math.round(Number(segment?.end || 0) * 1000)),
                        text: String(segment?.text || '').trim(),
                    }))
                    .filter((segment: { text: string }) => Boolean(segment.text))
                : [];

            return {
                transcriptText: String(payload?.text || '').trim(),
                segments,
                provider: 'local_whisper',
                model: whisperModel,
            };
        } catch (error) {
            const message = (error as Error)?.message || 'Local Whisper transcription failed';
            throw new Error(`Local transcription failed: ${message} (ffmpeg=${ffmpegBin}, whisper=${whisperBin})`);
        } finally {
            await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
        }
    }

    private async transcribeWithOpenAi(
        media: DownloadedMedia,
        apiKey: string,
        modelOverride?: string | null
    ): Promise<ObserverTranscriptPayload> {
        const mimeType = inferMimeTypeFromKey(media.filename);
        const model = modelOverride || process.env.LUMEN_TRANSCRIBE_MODEL || 'whisper-1';

        const formData = new FormData();
        formData.append('model', model);
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'segment');
        formData.append('file', new Blob([media.mediaBuffer], { type: mimeType }), media.filename);

        const transcriptionResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!transcriptionResp.ok) {
            const body = await transcriptionResp.text().catch(() => '');
            throw new Error(`Transcription failed (${transcriptionResp.status}): ${body.slice(0, 300)}`);
        }

        const payload: any = await transcriptionResp.json();
        const segments = Array.isArray(payload?.segments)
            ? payload.segments
                .map((segment: any) => ({
                    startMs: Math.max(0, Math.round(Number(segment?.start || 0) * 1000)),
                    endMs: Math.max(0, Math.round(Number(segment?.end || 0) * 1000)),
                    text: String(segment?.text || '').trim(),
                }))
                .filter((segment: { text: string }) => Boolean(segment.text))
            : [];

        return {
            transcriptText: String(payload?.text || '').trim(),
            segments,
            provider: 'openai',
            model,
        };
    }
}
