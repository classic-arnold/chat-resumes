import type { Server as HttpServer } from 'node:http';

import { verifyToken } from '@clerk/backend';
import { Server as SocketIOServer, type Namespace } from 'socket.io';

import { env } from '../config/env.js';
import { ApiError } from '../middleware/api-error-handler.js';
import {
  approveCandidateStory,
  endRecruiterSession,
  getCandidateChatState,
  getRecruiterChatState,
  processCandidateChatTurn,
  processRecruiterChatTurn,
} from '../services/chat.js';
import {
  canAccessSubscriptionFeatures,
  syncLocalUserFromClerk,
  type SyncedLocalUser,
} from '../services/users.js';
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

const toSocketErrorPayload = (error: unknown) => {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: 'socket_internal_error',
    message: 'A realtime error occurred.',
  };
};

const getCandidateAuthToken = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const token = Reflect.get(value, 'token');
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
};

const getRecruiterHandshakeValue = (value: unknown, key: 'slug' | 'visitorToken') => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const handshakeValue = Reflect.get(value, key);
  return typeof handshakeValue === 'string' && handshakeValue.trim().length > 0
    ? handshakeValue.trim()
    : null;
};

const authenticateCandidateSocket = async (token: string) => {
  if (!env.clerkSecretKey) {
    throw new ApiError({
      code: 'clerk_not_configured',
      message: 'Candidate realtime auth is not configured.',
      statusCode: 503,
    });
  }

  const verification = await verifyToken(token, {
    secretKey: env.clerkSecretKey,
  });
  const clerkUserId =
    verification && typeof verification === 'object' && 'sub' in verification
      ? String(verification.sub)
      : null;

  if (!clerkUserId) {
    throw new ApiError({
      code: 'candidate_socket_unauthenticated',
      message: 'A valid candidate auth token is required for realtime chat.',
      statusCode: 401,
    });
  }

  const user = await syncLocalUserFromClerk(clerkUserId);

  if (!canAccessSubscriptionFeatures(user)) {
    throw new ApiError({
      code: 'candidate_subscription_required',
      message: 'An active subscription is required for the private candidate chat.',
      statusCode: 402,
    });
  }

  return user;
};

const syncCandidateSocketState = async (socket: Parameters<Namespace['on']>[1] extends (socket: infer T) => void ? T : never, user: SyncedLocalUser) => {
  const state = await getCandidateChatState(user);

  socket.emit('candidate:session', state);
};

export const createRealtimeGateway = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      credentials: true,
      origin: env.clientOrigins,
    },
    path: env.socketPath,
  });

  const candidateNamespace = io.of('/candidate');
  const recruiterNamespace = io.of('/recruiter');

  bindNamespaceLogging(candidateNamespace, 'candidate');
  bindNamespaceLogging(recruiterNamespace, 'recruiter');

  candidateNamespace.use(async (socket, next) => {
    try {
      const token = getCandidateAuthToken(socket.handshake.auth);

      if (!token) {
        throw new ApiError({
          code: 'candidate_socket_missing_token',
          message: 'A candidate auth token is required for realtime chat.',
          statusCode: 401,
        });
      }

      socket.data.user = await authenticateCandidateSocket(token);
      next();
    } catch (error) {
      next(new Error(toSocketErrorPayload(error).message));
    }
  });

  recruiterNamespace.use(async (socket, next) => {
    const slug = getRecruiterHandshakeValue(socket.handshake.auth, 'slug');

    if (!slug) {
      next(new Error('A public profile slug is required for recruiter chat.'));
      return;
    }

    socket.data.slug = slug;
    socket.data.visitorToken = getRecruiterHandshakeValue(socket.handshake.auth, 'visitorToken');
    next();
  });

  candidateNamespace.on('connection', async (socket) => {
    const user = socket.data.user as SyncedLocalUser;

    try {
      await syncCandidateSocketState(socket, user);
    } catch (error) {
      socket.emit('candidate:error', toSocketErrorPayload(error));
    }

    socket.on('candidate:message', async (payload: unknown) => {
      try {
        const content =
          payload && typeof payload === 'object' && typeof Reflect.get(payload, 'content') === 'string'
            ? String(Reflect.get(payload, 'content'))
            : '';
        const state = await processCandidateChatTurn({
          content,
          user,
        });

        socket.emit('candidate:session', state);
      } catch (error) {
        socket.emit('candidate:error', toSocketErrorPayload(error));
      }
    });

    socket.on('candidate:approve-story', async (payload: unknown) => {
      try {
        const storyId =
          payload && typeof payload === 'object' && typeof Reflect.get(payload, 'storyId') === 'string'
            ? String(Reflect.get(payload, 'storyId'))
            : '';
        const state = await approveCandidateStory({
          storyId,
          user,
        });

        socket.emit('candidate:session', state);
      } catch (error) {
        socket.emit('candidate:error', toSocketErrorPayload(error));
      }
    });
  });

  recruiterNamespace.on('connection', async (socket) => {
    const slug = socket.data.slug as string;
    const visitorToken = socket.data.visitorToken as string | null;

    try {
      const state = await getRecruiterChatState({
        referrer: socket.handshake.headers.referer || null,
        slug,
        userAgent: socket.handshake.headers['user-agent'] || null,
        visitorToken,
      });

      socket.data.sessionId = state.sessionId;
      socket.data.visitorToken = state.visitorToken;
      socket.emit('recruiter:session', state);
    } catch (error) {
      socket.emit('recruiter:error', toSocketErrorPayload(error));
    }

    socket.on('recruiter:message', async (payload: unknown) => {
      try {
        const content =
          payload && typeof payload === 'object' && typeof Reflect.get(payload, 'content') === 'string'
            ? String(Reflect.get(payload, 'content'))
            : '';
        const state = await processRecruiterChatTurn({
          content,
          referrer: socket.handshake.headers.referer || null,
          slug,
          userAgent: socket.handshake.headers['user-agent'] || null,
          visitorToken: (socket.data.visitorToken as string | null) ?? visitorToken,
        });

        socket.data.sessionId = state.sessionId;
        socket.data.visitorToken = state.visitorToken;
        socket.emit('recruiter:session', state);
      } catch (error) {
        socket.emit('recruiter:error', toSocketErrorPayload(error));
      }
    });

    socket.on('disconnect', async () => {
      const sessionId = socket.data.sessionId as string | null;

      if (!sessionId) {
        return;
      }

      try {
        await endRecruiterSession(sessionId);
      } catch (error) {
        logger.warn('socket.recruiter.end_session_failed', {
          error: toSocketErrorPayload(error),
          sessionId,
        });
      }
    });
  });

  return {
    candidateNamespace,
    io,
    path: env.socketPath,
    recruiterNamespace,
    logActivity: logSocketActivity,
  };
};

export type RealtimeGateway = ReturnType<typeof createRealtimeGateway>;