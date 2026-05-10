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

  return prisma.user.upsert({
    where: {
      clerkUserId,
    },
    update: {
      email,
    },
    create: {
      clerkUserId,
      email,
    },
    include: {
      subscription: true,
    },
  });
};

export type SyncedLocalUser = Awaited<ReturnType<typeof syncLocalUserFromClerk>>;

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

const isActiveSubscriptionStatus = (status: SubscriptionStatus) => {
  return status === 'active' || status === 'trialing';
};