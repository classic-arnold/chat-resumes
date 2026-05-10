import { Router } from 'express';

import { chatRouter } from './chat/index.js';
import { authRouter } from './auth/index.js';
import { billingRouter } from './billing/index.js';
import { dashboardRouter } from './dashboard/index.js';
import { profileRouter } from './profile/index.js';
import { publicRouter } from './public/index.js';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    routes: {
      authSession: 'GET /api/auth/session',
      billingStatus: 'GET /api/billing/status',
      candidateChatSession: 'GET /api/chat/candidate/session',
      dashboard: 'GET /api/dashboard',
      profile: 'GET /api/profile',
      publicProfile: 'GET /api/public/profiles/:slug',
      stripeWebhooks: 'POST /api/stripe/webhooks',
    },
    service: 'chat-resumes-backend',
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/billing', billingRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/public', publicRouter);