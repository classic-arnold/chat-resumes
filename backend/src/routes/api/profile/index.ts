import { Router } from 'express';
import { z } from 'zod';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { ApiError, asyncHandler } from '../../../middleware/api-error-handler.js';
import {
  getCandidateProfile,
  getQuizAnswers,
  MAX_QUIZ_ANSWER_CHARS,
  QUIZ_QUESTION_IDS,
  saveQuizAnswers,
  updateCandidateProfile,
} from '../../../services/profiles.js';
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

const quizAnswerValueSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    return value.slice(0, MAX_QUIZ_ANSWER_CHARS);
  },
  z.string().max(MAX_QUIZ_ANSWER_CHARS).nullable(),
);

const quizAnswersShape = QUIZ_QUESTION_IDS.reduce<Record<string, typeof quizAnswerValueSchema>>(
  (acc, id) => {
    acc[id] = quizAnswerValueSchema;
    return acc;
  },
  {},
);

const quizPutSchema = z.object({
  answers: z.object(quizAnswersShape).partial(),
});

profileRouter.get(
  '/quiz',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    response.json(await getQuizAnswers(user));
  }),
);

profileRouter.put(
  '/quiz',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const parsed = quizPutSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      throw new ApiError({
        code: 'invalid_quiz_payload',
        details: parsed.error.flatten(),
        message: 'The quiz payload is invalid.',
        statusCode: 400,
      });
    }

    const result = await saveQuizAnswers({
      input: parsed.data.answers,
      user,
    });
    response.json(result);
  }),
);