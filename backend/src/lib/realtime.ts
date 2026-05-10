import type { Server as HttpServer } from 'node:http';

import { Server as SocketIOServer, type Namespace } from 'socket.io';

import { env } from '../config/env.js';
import { logger } from './logger.js';

type SocketActivity = {
  event: string;
  scope: 'candidate' | 'recruiter' | 'system';
  namespace?: string;
  profileSlug?: string;
  reason?: string;
  sessionId?: string;
  socketId?: string;
};

const logSocketActivity = (activity: SocketActivity) => {
  logger.info('socket.activity', {
    path: env.socketPath,
    ...activity,
  });
};

const bindNamespaceLogging = (
  namespace: Namespace,
  scope: Extract<SocketActivity['scope'], 'candidate' | 'recruiter'>,
) => {
  namespace.on('connection', (socket) => {
    logSocketActivity({
      event: 'socket.connected',
      namespace: namespace.name,
      scope,
      socketId: socket.id,
    });

    socket.on('disconnect', (reason) => {
      logSocketActivity({
        event: 'socket.disconnected',
        namespace: namespace.name,
        reason,
        scope,
        socketId: socket.id,
      });
    });
  });
};

export const createRealtimeGateway = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      credentials: true,
      origin: env.clientOrigin,
    },
    path: env.socketPath,
  });

  const candidateNamespace = io.of('/candidate');
  const recruiterNamespace = io.of('/recruiter');

  bindNamespaceLogging(candidateNamespace, 'candidate');
  bindNamespaceLogging(recruiterNamespace, 'recruiter');

  return {
    candidateNamespace,
    io,
    path: env.socketPath,
    recruiterNamespace,
    logActivity: logSocketActivity,
  };
};

export type RealtimeGateway = ReturnType<typeof createRealtimeGateway>;