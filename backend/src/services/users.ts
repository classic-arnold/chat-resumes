import type { Prisma, SubscriptionStatus } from '@prisma/client';

import { getClerkUser } from '../auth/clerk.js';
import { ApiError } from '../middleware/api-error-handler.js';
import { prisma } from '../lib/prisma.js';

const getPrimaryEmailAddress = (clerkUser: Awaited<ReturnType<typeof getClerkUser>>) => {
  const primaryEmail = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
  );

  return primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
};

export const syncLocalUserFromClerk = async (clerkUserId: string) => {
  const clerkUser = await getClerkUser(clerkUserId);
  const email = getPrimaryEmailAddress(clerkUser);

  if (!email) {
    throw new ApiError({
      code: 'clerk_email_missing',
      message: 'The authenticated Clerk user does not have an email address.',
      statusCode: 422,
    });
  }

  const existingByClerkUserId = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    include: {
      subscription: true,
    },
  });

  if (existingByClerkUserId) {
    if (existingByClerkUserId.email === email) {
      return existingByClerkUserId;
    }

    const existingByEmail = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingByEmail && existingByEmail.id !== existingByClerkUserId.id) {
      return existingByClerkUserId;
    }

    return prisma.user.update({
      where: {
        id: existingByClerkUserId.id,
      },
      data: {
        email,
      },
      include: {
        subscription: true,
      },
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      subscription: true,
    },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: {
        id: existingByEmail.id,
      },
      data: {
        clerkUserId,
      },
      include: {
        subscription: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkUserId,
      email,
    },
    include: {
      subscription: true,
    },
  });
};

export type SyncedLocalUser = Awaited<ReturnType<typeof syncLocalUserFromClerk>>;

const temporaryFreeAccountAccessEnabled = true;

export const hasActiveSubscription = (
  subscription: Prisma.UserGetPayload<{
    include: {
      subscription: true;
    };
  }>['subscription'],
) => {
  if (!subscription) {
    return false;
  }

  return isActiveSubscriptionStatus(subscription.status);
};

export const canAccessSubscriptionFeatures = (user: SyncedLocalUser) => {
  return temporaryFreeAccountAccessEnabled || hasActiveSubscription(user.subscription);
};

export const assertUserHasActiveSubscription = (user: SyncedLocalUser) => {
  if (!canAccessSubscriptionFeatures(user)) {
    throw new ApiError({
      code: 'subscription_required',
      message: 'An active subscription is required for this route.',
      statusCode: 402,
    });
  }

  return user;
};

const isActiveSubscriptionStatus = (status: SubscriptionStatus) => {
  return status === 'active' || status === 'trialing';
};