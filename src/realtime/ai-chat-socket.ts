import type { Server as SocketIOServer, Socket } from 'socket.io';
import { handleAiChat } from '../services/ai-chat/hooks/handleAiChat';

interface ChatSendPayload {
    requestId?: string;
    message?: string;
    headers?: Record<string, string>;
}

function toHeaderRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim()) {
            out[k.toLowerCase()] = v;
        }
    }
    return out;
}

export function setupAiChatSocket(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.IO] connected: ${socket.id}`);
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] disconnected: ${socket.id} (${reason})`);
        });
        socket.on('ai-chat:send', async (payload: ChatSendPayload = {}) => {
            const requestId = payload.requestId || crypto.randomUUID();
            const message = typeof payload.message === 'string' ? payload.message.trim() : '';
            const headers = toHeaderRecord(payload.headers);
            console.log(`[Socket.IO][ai-chat:send] socket=${socket.id} requestId=${requestId} messageLen=${message.length}`);

            if (!message) {
                socket.emit('ai-chat:error', {
                    requestId,
                    error: 'Message is required',
                });
                return;
            }

            socket.emit('ai-chat:status', { requestId, status: 'processing' });
            socket.emit('ai-chat:status', { requestId, status: 'analyzing' });
            socket.emit('ai-chat:status', { requestId, status: 'generating' });

            try {
                const context: any = {
                    params: {
                        headers,
                        streamCallbacks: {
                            onResponsePartial: (partial: string, chunk: string) => {
                                socket.emit('ai-chat:status', { requestId, status: 'streaming' });
                                socket.emit('ai-chat:chunk', {
                                    requestId,
                                    chunk,
                                    partial,
                                });
                            },
                        },
                    },
                    data: { message },
                };

                await handleAiChat(context);
                const result = context.result || {};

                socket.emit('ai-chat:result', {
                    requestId,
                    result,
                });
                socket.emit('ai-chat:status', { requestId, status: 'done' });
            } catch (error: any) {
                socket.emit('ai-chat:error', {
                    requestId,
                    error: error?.message || 'AI chat failed',
                });
            }
        });
    });
}
