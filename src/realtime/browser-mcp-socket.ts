import type { Server as SocketIOServer, Socket } from 'socket.io';
import { BrowserMcpServer } from '../mcp/browser/browser-mcp-server';
import { BrowserSessionManager } from '../mcp/browser/session-manager';
import type { BrowserToolName } from '../mcp/browser/types';

interface BrowserToolPayload {
    requestId?: string;
    sessionId?: string;
    tool?: BrowserToolName;
    args?: Record<string, unknown>;
}

interface BrowserSessionClosePayload {
    requestId?: string;
    sessionId?: string;
}

const browserSessions = new BrowserSessionManager();
const browserMcp = new BrowserMcpServer(browserSessions);

export function setupBrowserMcpSocket(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.IO][browser-mcp] connected: ${socket.id}`);
        socket.on('browser-mcp:tool', async (payload: BrowserToolPayload = {}) => {
            const requestId = payload.requestId || crypto.randomUUID();
            const tool = payload.tool;
            console.log(`[Socket.IO][browser-mcp:tool] socket=${socket.id} requestId=${requestId} tool=${tool || 'N/A'}`);
            if (!tool) {
                socket.emit('browser-mcp:error', {
                    requestId,
                    error: 'tool is required',
                });
                return;
            }

            socket.emit('browser-mcp:status', { requestId, status: 'processing', tool });
            const result = await browserMcp.execute(
                tool,
                payload.args || {},
                payload.sessionId
            );

            if (!result.ok) {
                socket.emit('browser-mcp:error', {
                    requestId,
                    sessionId: result.sessionId,
                    tool,
                    error: result.error || 'tool failed',
                });
                return;
            }

            socket.emit('browser-mcp:result', {
                requestId,
                result,
            });
            socket.emit('browser-mcp:status', { requestId, status: 'done', tool });
        });

        socket.on('browser-mcp:close-session', async (payload: BrowserSessionClosePayload = {}) => {
            const requestId = payload.requestId || crypto.randomUUID();
            const sessionId = payload.sessionId || '';
            if (!sessionId) {
                socket.emit('browser-mcp:error', {
                    requestId,
                    error: 'sessionId is required',
                });
                return;
            }
            const closed = await browserSessions.close(sessionId);
            socket.emit('browser-mcp:result', {
                requestId,
                result: {
                    ok: closed,
                    sessionId,
                },
            });
        });
    });
}
