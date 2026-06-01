import { getBillingStatusForUser } from './billing.js';
import { prisma } from '../lib/prisma.js';
import { getCandidateProfile } from './profiles.js';
import { hasActiveSubscription, type SyncedLocalUser } from './users.js';

const formatMinutes = (milliseconds: number) => {
  const minutes = milliseconds / 60000;
  return Number(minutes.toFixed(1));
};

const buildActivityTitle = (value: string | null | undefined, fallback: string) => {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value.trim().slice(0, 72);
};

export const getDashboardSummary = async (user: SyncedLocalUser) => {
  const profile = await getCandidateProfile(user);
  const [
    totalViews,
    viewsThisWeek,
    chatSessions,
    recruiterMessages,
    approvedStoriesCount,
    recentVisits,
    recentSessions,
    durations,
  ] = await Promise.all([
    prisma.recruiterVisit.count({
      where: {
        profileId: profile.id,
      },
    }),
    prisma.recruiterVisit.count({
      where: {
        profileId: profile.id,
        visitedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.recruiterChatSession.count({
      where: {
        profileId: profile.id,
      },
    }),
    prisma.recruiterChatMessage.count({
      where: {
        session: {
          profileId: profile.id,
        },
      },
    }),
    prisma.story.count({
      where: {
        status: 'approved',
        userId: user.id,
      },
    }),
    prisma.recruiterVisit.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: {
        visitedAt: 'desc',
      },
      take: 4,
    }),
    prisma.recruiterChatSession.findMany({
      where: {
        profileId: profile.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 4,
    }),
    prisma.recruiterChatSession.findMany({
      where: {
        profileId: profile.id,
      },
      select: {
        endedAt: true,
        startedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const averageChatDurationMinutes =
    durations.length === 0
      ? 0
      : formatMinutes(
          durations.reduce((totalDuration, session) => {
            const endedAt = session.endedAt ?? session.updatedAt;
            return totalDuration + (endedAt.getTime() - session.startedAt.getTime());
          }, 0) / durations.length,
        );

  const activity = [
    ...recentSessions.map((session) => ({
      id: session.id,
      occurredAt: session.startedAt.toISOString(),
      summary: `${session.messages.length} messages · ${formatMinutes((session.endedAt ?? session.updatedAt).getTime() - session.startedAt.getTime())} min conversation`,
      title: buildActivityTitle(session.messages[0]?.content, 'Recruiter started a public AI chat'),
      type: 'chat' as const,
    })),
    ...recentVisits.map((visit) => ({
      id: visit.id,
      occurredAt: visit.visitedAt.toISOString(),
      summary: buildActivityTitle(visit.userAgent, visit.referrer || 'Anonymous recruiter viewed your public link'),
      title: 'Recruiter viewed your public AI link',
      type: 'view' as const,
    })),
  ]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 6);

  return {
    activity,
    billing: getBillingStatusForUser(user),
    metrics: {
      approvedStoriesCount,
      averageChatDurationMinutes,
      chatSessions,
      profileCompletenessPercentage: profile.completeness.percentage,
      recruiterMessages,
      totalViews,
      viewsThisWeek,
    },
    profile,
    publicLinkActive: hasActiveSubscription(user.subscription) && profile.isPublic,
  };
};