import { Router } from 'express';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { asyncHandler } from '../../../middleware/api-error-handler.js';
import { getDashboardSummary } from '../../../services/dashboard.js';
import { assertUserHasActiveSubscription, syncLocalUserFromClerk } from '../../../services/users.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = assertUserHasActiveSubscription(await syncLocalUserFromClerk(auth.userId));

    response.json(await getDashboardSummary(user));
  }),
);