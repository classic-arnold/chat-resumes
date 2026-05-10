import type { SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/api-error-handler.js';
import { hasActiveSubscription, type SyncedLocalUser } from './users.js';

const stripeClient = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

const resolveClientUrl = (path: string, providedUrl?: string) => {
  if (!providedUrl) {
    return new URL(path, env.clientOrigin).toString();
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(providedUrl);
  } catch {
    throw new ApiError({
      code: 'invalid_redirect_url',
      message: 'The billing redirect URL is invalid.',
      statusCode: 400,
    });
  }

  if (!env.clientOrigins.includes(parsedUrl.origin)) {
    throw new ApiError({
      code: 'invalid_redirect_origin',
      message: 'The billing redirect URL origin is not allowed.',
      statusCode: 400,
    });
  }

  return parsedUrl.toString();
};

const getStripeClient = () => {
  if (!stripeClient || !env.stripeSecretKey) {
    throw new ApiError({
      code: 'stripe_not_configured',
      message: 'Stripe is not configured for this backend environment.',
      statusCode: 503,
    });
  }

  return stripeClient;
};

const assertStripeCheckoutConfigured = () => {
  if (!env.isStripeCheckoutConfigured || !env.stripePriceId) {
    throw new ApiError({
      code: 'stripe_checkout_not_configured',
      message: 'Stripe checkout is not configured yet.',
      statusCode: 503,
    });
  }
};

const assertStripeWebhookConfigured = () => {
  if (!env.isStripeWebhookConfigured || !env.stripeWebhookSecret) {
    throw new ApiError({
      code: 'stripe_webhooks_not_configured',
      message: 'Stripe webhooks are not configured yet.',
      statusCode: 503,
    });
  }
};

const ensureStripeCustomer = async (user: SyncedLocalUser) => {
  if (user.subscription?.stripeCustomerId) {
    return user.subscription;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      clerkUserId: user.clerkUserId,
      userId: user.id,
    },
  });

  return prisma.subscription.upsert({
    where: {
      userId: user.id,
    },
    update: {
      stripeCustomerId: customer.id,
    },
    create: {
      status: 'incomplete',
      stripeCustomerId: customer.id,
      userId: user.id,
    },
  });
};

const mapStripeStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'canceled':
      return 'canceled';
    case 'past_due':
    case 'paused':
    case 'unpaid':
      return 'past_due';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    default:
      return 'incomplete';
  }
};

const syncSubscriptionRecord = async ({
  currentPeriodEnd,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  userId,
}: {
  currentPeriodEnd: Date | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  userId?: string | null;
}) => {
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeCustomerId },
        stripeSubscriptionId ? { stripeSubscriptionId } : undefined,
      ].filter(Boolean) as Array<{ stripeCustomerId?: string; stripeSubscriptionId?: string }>,
    },
  });

  if (existingSubscription) {
    return prisma.subscription.update({
      where: {
        id: existingSubscription.id,
      },
      data: {
        currentPeriodEnd,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
  }

  if (!userId) {
    logger.warn('billing.subscription.missing_user', {
      stripeCustomerId,
      stripeSubscriptionId,
    });
    return null;
  }

  return prisma.subscription.create({
    data: {
      currentPeriodEnd,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      userId,
    },
  });
};

const getStripeSubscriptionCurrentPeriodEnd = (subscription: Stripe.Subscription) => {
  const periodEndTimestamps = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number');

  if (periodEndTimestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...periodEndTimestamps) * 1000);
};

const syncStripeSubscription = async (subscription: Stripe.Subscription) => {
  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  return syncSubscriptionRecord({
    currentPeriodEnd: getStripeSubscriptionCurrentPeriodEnd(subscription),
    status: mapStripeStatus(subscription.status),
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    userId: subscription.metadata.userId,
  });
};

export const getBillingStatusForUser = (user: SyncedLocalUser) => {
  return {
    canManageBilling: Boolean(user.subscription?.stripeCustomerId),
    checkoutRequired: !hasActiveSubscription(user.subscription),
    currentPeriodEnd: user.subscription?.currentPeriodEnd?.toISOString() ?? null,
    hasActiveSubscription: hasActiveSubscription(user.subscription),
    isStripeConfigured: env.isStripeCheckoutConfigured,
    status: user.subscription?.status ?? null,
  };
};

export const createCheckoutSession = async ({
  cancelUrl,
  successUrl,
  user,
}: {
  cancelUrl?: string;
  successUrl?: string;
  user: SyncedLocalUser;
}) => {
  assertStripeCheckoutConfigured();

  const stripe = getStripeClient();
  const subscription = await ensureStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    cancel_url: resolveClientUrl('/billing/cancel', cancelUrl),
    client_reference_id: user.id,
    customer: subscription.stripeCustomerId,
    line_items: [{
      price: env.stripePriceId,
      quantity: 1,
    }],
    metadata: {
      clerkUserId: user.clerkUserId,
      userId: user.id,
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
        clerkUserId: user.clerkUserId,
        userId: user.id,
      },
    },
    success_url: resolveClientUrl('/billing/success', successUrl),
  });

  if (!session.url) {
    throw new ApiError({
      code: 'stripe_checkout_missing_url',
      message: 'Stripe checkout did not return a redirect URL.',
      statusCode: 502,
    });
  }

  return session.url;
};

export const createBillingPortalSession = async ({
  returnUrl,
  user,
}: {
  returnUrl?: string;
  user: SyncedLocalUser;
}) => {
  const stripe = getStripeClient();

  if (!user.subscription?.stripeCustomerId) {
    throw new ApiError({
      code: 'billing_portal_unavailable',
      message: 'A Stripe customer does not exist for this user yet.',
      statusCode: 409,
    });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: resolveClientUrl('/dashboard', returnUrl),
  });

  return session.url;
};

export const constructStripeEvent = (payload: Buffer, signatureHeader: string) => {
  assertStripeWebhookConfigured();

  const stripe = getStripeClient();

  return stripe.webhooks.constructEvent(payload, signatureHeader, env.stripeWebhookSecret!);
};

export const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.mode === 'subscription' &&
        typeof session.subscription === 'string'
      ) {
        const stripe = getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await syncSubscriptionRecord({
          currentPeriodEnd: getStripeSubscriptionCurrentPeriodEnd(subscription),
          status: mapStripeStatus(subscription.status),
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '',
          stripeSubscriptionId: subscription.id,
          userId: session.metadata?.userId ?? session.client_reference_id,
        });
      }

      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await syncStripeSubscription(subscription);
      break;
    }
    default:
      logger.info('stripe.webhook.ignored', {
        eventType: event.type,
      });
  }
};