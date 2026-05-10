import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { clerkApiMiddleware } from './auth/clerk.js';
import { env } from './config/env.js';
import { apiErrorHandler, apiNotFoundHandler } from './middleware/api-error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { apiRouter } from './routes/api/index.js';
import { healthRouter } from './routes/health.js';
import { stripeWebhookRouter } from './routes/stripe/webhooks.js';

export const createApp = () => {
  const app = express();

  app.use(requestLogger);
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.clientOrigins,
    }),
  );

  // Stripe webhook signature verification requires raw body access.
  app.use('/api/stripe/webhooks', stripeWebhookRouter);
  app.use(express.json());

  app.get('/', (_request, response) => {
    response.json({
      name: 'chat-resumes-backend',
      status: 'ok',
    });
  });

  app.use('/health', healthRouter);
  app.use('/api', clerkApiMiddleware);
  app.use('/api', apiRouter);
  app.use('/api', apiNotFoundHandler);
  app.use(apiErrorHandler);

  return app;
};