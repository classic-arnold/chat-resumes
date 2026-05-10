import { Router } from 'express';
import { z } from 'zod';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { ApiError, asyncHandler } from '../../../middleware/api-error-handler.js';
import { getCandidateProfile, updateCandidateProfile } from '../../../services/profiles.js';
import { syncLocalUserFromClerk } from '../../../services/users.js';

const nullableTrimmedString = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  },
  z.string().nullable().optional(),
);

const profilePatchSchema = z.object({
  displayName: nullableTrimmedString,
  headline: nullableTrimmedString,
  isPublic: z.boolean().optional(),
  location: nullableTrimmedString,
  summary: nullableTrimmedString,
  targetRoles: z.array(z.string()).max(8).optional(),
});

const parsePatchBody = (payload: unknown) => {
  const parsedBody = profilePatchSchema.safeParse(payload ?? {});

  if (!parsedBody.success) {
    throw new ApiError({
      code: 'invalid_profile_payload',
      details: parsedBody.error.flatten(),
      message: 'The profile update payload is invalid.',
      statusCode: 400,
    });
  }

  return parsedBody.data;
};

export const profileRouter = Router();

profileRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);

    response.json(await getCandidateProfile(user));
  }),
);

profileRouter.patch(
  '/',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const input = parsePatchBody(request.body);

    response.json(
      await updateCandidateProfile({
        input,
        user,
      }),
    );
  }),
);