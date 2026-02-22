"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAiChatSocket = setupAiChatSocket;
const handleAiChat_1 = require("../services/ai-chat/hooks/handleAiChat");
function toHeaderRecord(value) {
    if (!value || typeof value !== 'object')
        return {};
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'string' && v.trim()) {
            out[k.toLowerCase()] = v;
        }
    }
    return out;
}
function setupAiChatSocket(io) {
    io.on('connection', (socket) => {
        socket.on('ai-chat:send', async (payload = {}) => {
            const requestId = payload.requestId || crypto.randomUUID();
            const message = typeof payload.message === 'string' ? payload.message.trim() : '';
            const headers = toHeaderRecord(payload.headers);
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
                const context = {
                    params: {
                        headers,
                        streamCallbacks: {
                            onResponsePartial: (partial, chunk) => {
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
                await (0, handleAiChat_1.handleAiChat)(context);
                const result = context.result || {};
                socket.emit('ai-chat:result', {
                    requestId,
                    result,
                });
                socket.emit('ai-chat:status', { requestId, status: 'done' });
            }
            catch (error) {
                socket.emit('ai-chat:error', {
                    requestId,
                    error: error?.message || 'AI chat failed',
                });
            }
        });
    });
}
