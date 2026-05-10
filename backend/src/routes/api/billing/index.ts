import { Router } from 'express';
import { z } from 'zod';

import { assertApiAuthenticated } from '../../../auth/clerk.js';
import { asyncHandler, ApiError } from '../../../middleware/api-error-handler.js';
import {
  createBillingPortalSession,
  createCheckoutSession,
  getBillingStatusForUser,
} from '../../../services/billing.js';
import { syncLocalUserFromClerk } from '../../../services/users.js';

const checkoutRequestSchema = z.object({
  cancelUrl: z.string().url().optional(),
  successUrl: z.string().url().optional(),
});

const portalRequestSchema = z.object({
  returnUrl: z.string().url().optional(),
});

const parseRequestBody = <T extends z.ZodTypeAny>(schema: T, payload: unknown): z.infer<T> => {
  const parsed = schema.safeParse(payload ?? {});

  if (!parsed.success) {
    throw new ApiError({
      code: 'invalid_request_body',
      details: parsed.error.flatten(),
      message: 'The request body is invalid.',
      statusCode: 400,
    });
  }

  return parsed.data;
};

export const billingRouter = Router();

billingRouter.get(
  '/status',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);

    response.json(getBillingStatusForUser(user));
  }),
);

billingRouter.post(
  '/checkout-session',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const body = parseRequestBody(checkoutRequestSchema, request.body);
    const checkoutUrl = await createCheckoutSession({
      cancelUrl: body.cancelUrl,
      successUrl: body.successUrl,
      user,
    });

    response.status(201).json({
      checkoutUrl,
    });
  }),
);

billingRouter.post(
  '/portal-session',
  asyncHandler(async (request, response) => {
    const auth = assertApiAuthenticated(request);
    const user = await syncLocalUserFromClerk(auth.userId);
    const body = parseRequestBody(portalRequestSchema, request.body);
    const portalUrl = await createBillingPortalSession({
      returnUrl: body.returnUrl,
      user,
    });

    response.status(201).json({
      portalUrl,
    });
  }),
);