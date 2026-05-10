import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import type { Request, RequestHandler } from 'express';

import { env } from '../config/env.js';
import { ApiError } from '../middleware/api-error-handler.js';

export const clerkApiMiddleware: RequestHandler = env.isClerkConfigured
  ? clerkMiddleware()
  : (_request, _response, next) => {
      next();
    };

export const getRequestAuth = (request: Request) => {
  if (!env.isClerkConfigured) {
    return null;
  }

  return getAuth(request);
};

export const assertApiAuthenticated = (request: Request) => {
  if (!env.isClerkConfigured) {
    throw new ApiError({
      code: 'clerk_not_configured',
      message: 'Clerk backend auth is not configured.',
      statusCode: 503,
    });
  }

  const auth = getAuth(request);

  if (!auth.userId) {
    throw new ApiError({
      code: 'unauthenticated',
      message: 'Authentication is required for this API route.',
      statusCode: 401,
    });
  }

  return auth;
};

export const getClerkUser = async (clerkUserId: string) => {
  return clerkClient.users.getUser(clerkUserId);
};