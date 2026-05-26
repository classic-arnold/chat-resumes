import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';

import { logger } from '../lib/logger.js';

type ApiErrorOptions = {
  code: string;
  details?: Record<string, unknown>;
  message: string;
  statusCode: number;
};

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  statusCode: number;

  constructor({ code, details, message, statusCode }: ApiErrorOptions) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
};

export const apiNotFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new ApiError({
      code: 'api_not_found',
      details: {
        method: request.method,
        path: request.originalUrl,
      },
      message: 'API route not found.',
      statusCode: 404,
    }),
  );
};

export const apiErrorHandler: ErrorRequestHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (!(error instanceof ApiError)) {
    logger.error('uncaught.error', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }

  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError({
          code: 'internal_server_error',
          details: undefined,
          message: 'Internal server error.',
          statusCode: 500,
        });

  logger.error('api.error', {
    code: apiError.code,
    details: apiError.details,
    message: apiError.message,
    method: request.method,
    path: request.originalUrl,
    statusCode: apiError.statusCode,
  });

  response.status(apiError.statusCode).json({
    error: {
      code: apiError.code,
      details: apiError.details,
      message: apiError.message,
    },
    ok: false,
  });
};