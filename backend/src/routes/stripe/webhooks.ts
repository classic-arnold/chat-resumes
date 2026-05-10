import express, { Router } from 'express';

import { ApiError, asyncHandler } from '../../middleware/api-error-handler.js';
import { constructStripeEvent, handleStripeWebhookEvent } from '../../services/billing.js';

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (request, response) => {
    const signatureHeader = request.headers['stripe-signature'];

    if (!signatureHeader || Array.isArray(signatureHeader)) {
      throw new ApiError({
        code: 'stripe_signature_missing',
        message: 'Stripe signature header is missing.',
        statusCode: 400,
      });
    }

    const event = constructStripeEvent(request.body as Buffer, signatureHeader);
    await handleStripeWebhookEvent(event);

    response.json({
      ok: true,
      received: true,
    });
  }),
);