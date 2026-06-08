import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';

const server = http.createServer(app);

// Socket.io
const io = new SocketServer(server, {
  cors: { origin: env.clientUrl, credentials: true },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  shutdown('unhandledRejection');
});

const start = async () => {
  await connectDB();
  server.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

start();

export { io };
