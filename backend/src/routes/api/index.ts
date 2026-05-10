import { Router } from 'express';

import { authRouter } from './auth/index.js';
import { billingRouter } from './billing/index.js';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    routes: {
      authSession: 'GET /api/auth/session',
      billingStatus: 'GET /api/billing/status',
      dashboard: 'GET /api/dashboard',
      publicProfile: 'GET /api/public/profiles/:slug',
      stripeWebhooks: 'POST /api/stripe/webhooks',
    },
    service: 'chat-resumes-backend',
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/billing', billingRouter);