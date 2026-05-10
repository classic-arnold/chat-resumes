import { Router } from 'express';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { asyncHandler } from '../../../middleware/api-error-handler.js';
import { approveCandidateStory, getCandidateChatState } from '../../../services/chat.js';
import { assertUserHasActiveSubscription, syncLocalUserFromClerk } from '../../../services/users.js';

export const chatRouter = Router();

chatRouter.get(
  '/candidate/session',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = assertUserHasActiveSubscription(await syncLocalUserFromClerk(auth.userId));

    response.json(await getCandidateChatState(user));
  }),
);

chatRouter.post(
  '/candidate/stories/:storyId/approve',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = assertUserHasActiveSubscription(await syncLocalUserFromClerk(auth.userId));
    const storyId = Array.isArray(request.params.storyId)
      ? request.params.storyId[0] ?? ''
      : request.params.storyId ?? '';

    response.json(
      await approveCandidateStory({
        storyId,
        user,
      }),
    );
  }),
);