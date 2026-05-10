import { Router } from 'express';

import { getRequestAuth } from '../../../auth/clerk.js';
import { asyncHandler } from '../../../middleware/api-error-handler.js';
import { hasActiveSubscription, syncLocalUserFromClerk } from '../../../services/users.js';

export const authRouter = Router();

authRouter.get(
  '/session',
  asyncHandler(async (request, response) => {
    const auth = getRequestAuth(request);

    if (!auth?.userId) {
      response.json({
        hasActiveSubscription: false,
        isAuthenticated: false,
        user: null,
      });
      return;
    }

    const user = await syncLocalUserFromClerk(auth.userId);

    response.json({
      hasActiveSubscription: hasActiveSubscription(user.subscription),
      isAuthenticated: true,
      user: {
        clerkUserId: user.clerkUserId,
        createdAt: user.createdAt.toISOString(),
        email: user.email,
        id: user.id,
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  }),
);