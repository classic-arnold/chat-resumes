import type { Server as HttpServer } from 'node:http';

import { env } from '../config/env.js';
import { logger } from './logger.js';

type SocketActivity = {
  event: string;
  scope: 'candidate' | 'recruiter' | 'system';
  profileSlug?: string;
  sessionId?: string;
  socketId?: string;
};

export const createRealtimeGateway = (_httpServer: HttpServer) => ({
  path: env.socketPath,
  logActivity: (activity: SocketActivity) => {
    logger.info('socket.activity', {
      path: env.socketPath,
      ...activity,
    });
  },
});

export type RealtimeGateway = ReturnType<typeof createRealtimeGateway>;