import { Router } from 'express';

import { asyncHandler } from '../../../middleware/api-error-handler.js';
import { getPublicProfileResponse } from '../../../services/profiles.js';

export const publicRouter = Router();

publicRouter.get(
  '/profiles/:slug',
  asyncHandler(async (request, response) => {
    const visitorTokenHeader = request.header('x-visitor-token');
    const slug = Array.isArray(request.params.slug)
      ? request.params.slug[0] ?? ''
      : request.params.slug ?? '';

    response.json(
      await getPublicProfileResponse({
        referrer: request.header('referer') || null,
        slug,
        userAgent: request.header('user-agent') || null,
        visitorToken: visitorTokenHeader || null,
      }),
    );
  }),
);