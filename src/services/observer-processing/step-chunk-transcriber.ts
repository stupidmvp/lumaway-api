import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { S3Provider } from '../../providers';

const execFileAsync = promisify(execFile);
const nowMs = () => Date.now();

export type StepTranscriptWindow = {
    eventId: string;
    startMs: number;
    endMs: number;
};

export type StepChunkTranscriptionResult = {
    byEventId: Map<string, { text: string; chunks: Array<{ startMs: number; endMs: number; text: string }> }>;
    status: {
        enabled: boolean;
        ok: boolean;
        used: boolean;
        reason?: string;
        transcribedWindows?: number;
    };
};

function resolveBinaryPath(envValue: string | undefined, candidates: string[], binaryName: string): string {
    if (envValue && envValue.trim()) return envValue.trim();
    const found = candidates.find((path) => existsSync(path));
    return found || binaryName;
}

function textPreview(text: string, maxLen = 220): string {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.length <= maxLen ? normalized : `${normalized.slice(0, maxLen - 1)}…`;
}

function normalizeSentence(value: string): string {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const cleaned = text.replace(/^[,.:;\-–—\s]+/, '').trim();
    if (!cleaned) return '';
    const first = cleaned.charAt(0).toUpperCase();
    let normalized = `${first}${cleaned.slice(1)}`;
    if (!/[.!?…]$/.test(normalized)) normalized = `${normalized}.`;
    return normalized;
}

async function downloadSessionMedia(videoS3Key: string): Promise<{ filename: string; mediaBuffer: ArrayBuffer }> {
    const s3 = new S3Provider();
    const signedUrl = await s3.getSignedDownloadUrl(videoS3Key);
    const mediaResponse = await fetch(signedUrl);
    if (!mediaResponse.ok) {
        throw new Error(`Unable to download media for step chunk transcription (${mediaResponse.status})`);
    }
    return {
        filename: videoS3Key.split('/').pop() || `lumen-recording-${randomUUID()}.webm`,
        mediaBuffer: await mediaResponse.arrayBuffer(),
    };
}

export async function transcribeStepWindows(input: {
    videoS3Key: string | null | undefined;
    windows: StepTranscriptWindow[];
}): Promise<StepChunkTranscriptionResult> {
    const enabled = (process.env.LUMEN_STEP_CHUNK_TRANSCRIBE || 'true').toLowerCase() !== 'false';
    if (!enabled) {
        return {
            byEventId: new Map(),
            status: { enabled: false, ok: false, used: false, reason: 'disabled_by_env' },
        };
    }

    if (!input.videoS3Key) {
        return {
            byEventId: new Map(),
            status: { enabled: true, ok: false, used: false, reason: 'missing_video_s3_key' },
        };
    }

    const maxWindows = Number(process.env.LUMEN_STEP_CHUNK_MAX_WINDOWS || 12);
    const maxDurationSec = Number(process.env.LUMEN_STEP_CHUNK_MAX_DURATION_SEC || 18);
    const totalTimeoutMs = Number(process.env.LUMEN_STEP_CHUNK_TIMEOUT_MS || 90000);
    const ffmpegTimeoutMs = Number(process.env.LUMEN_STEP_CHUNK_FFMPEG_TIMEOUT_MS || 15000);
    const whisperTimeoutMs = Number(process.env.LUMEN_STEP_CHUNK_WHISPER_TIMEOUT_MS || 25000);
    const startedAt = nowMs();

    const windows = input.windows
        .filter((item) => item.endMs > item.startMs)
        .slice(0, maxWindows);
    if (!windows.length) {
        return {
            byEventId: new Map(),
            status: { enabled: true, ok: false, used: false, reason: 'no_windows' },
        };
    }

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

    const byEventId = new Map<string, { text: string; chunks: Array<{ startMs: number; endMs: number; text: string }> }>();

    const workDir = await mkdtemp(join(tmpdir(), 'lumen-step-chunks-'));
    const inputPath = join(workDir, `session-${randomUUID()}.webm`);
    const audioPath = join(workDir, 'session-audio.wav');

    try {
        const media = await downloadSessionMedia(input.videoS3Key);
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
        ], { timeout: ffmpegTimeoutMs });

        let transcribedWindows = 0;
        for (const window of windows) {
            if (nowMs() - startedAt > totalTimeoutMs) {
                return {
                    byEventId,
                    status: {
                        enabled: true,
                        ok: false,
                        used: transcribedWindows > 0,
                        reason: 'step_chunk_total_timeout',
                        transcribedWindows,
                    },
                };
            }

            const startSec = Math.max(0, Math.floor((window.startMs - 120) / 10) / 100);
            const rawDurationSec = Math.max(0.8, (window.endMs - window.startMs + 380) / 1000);
            const durationSec = Math.min(rawDurationSec, maxDurationSec);

            const chunkPath = join(workDir, `chunk-${window.eventId}.wav`);
            await execFileAsync(ffmpegBin, [
                '-y',
                '-i',
                audioPath,
                '-ss',
                String(startSec),
                '-t',
                String(durationSec),
                '-ac',
                '1',
                '-ar',
                '16000',
                '-f',
                'wav',
                chunkPath,
            ], { timeout: ffmpegTimeoutMs });

            const whisperArgs = [
                chunkPath,
                '--model',
                whisperModel,
                '--output_format',
                'json',
                '--output_dir',
                workDir,
            ];
            if (language !== 'auto') whisperArgs.push('--language', language);

            await execFileAsync(whisperBin, whisperArgs, { timeout: whisperTimeoutMs });
            const jsonOutputPath = join(workDir, `${basename(chunkPath).replace(/\.[^.]+$/, '')}.json`);
            const raw = await readFile(jsonOutputPath, 'utf-8');
            const payload = JSON.parse(raw);
            const text = normalizeSentence(textPreview(String(payload?.text || '').trim(), 260));
            if (!text) continue;

            byEventId.set(window.eventId, {
                text,
                chunks: [{
                    startMs: window.startMs,
                    endMs: window.endMs,
                    text,
                }],
            });
            transcribedWindows += 1;
        }

        return {
            byEventId,
            status: {
                enabled: true,
                ok: true,
                used: transcribedWindows > 0,
                transcribedWindows,
            },
        };
    } catch (error) {
        return {
            byEventId,
            status: {
                enabled: true,
                ok: false,
                used: false,
                reason: (error as Error)?.message || 'step_chunk_transcription_failed',
            },
        };
    } finally {
        await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
}
