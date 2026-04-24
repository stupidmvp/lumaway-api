import type { Server as SocketIOServer, Socket } from 'socket.io';

const HEARTBEAT_INTERVAL_MS = 10_000;

export function setupSocketHeartbeat(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
        socket.emit('luma:heartbeat', { ts: Date.now(), type: 'server_connected' });

        const timer = setInterval(() => {
            socket.emit('luma:heartbeat', { ts: Date.now(), type: 'tick' });
        }, HEARTBEAT_INTERVAL_MS);
        timer.unref?.();

        socket.on('luma:heartbeat:ping', () => {
            socket.emit('luma:heartbeat:pong', { ts: Date.now() });
        });

        socket.on('disconnect', () => {
            clearInterval(timer);
        });
    });
}

