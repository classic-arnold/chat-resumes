import { randomUUID } from 'node:crypto';

import type { Profile, Story } from '@prisma/client';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import type { SyncedLocalUser } from './users.js';

type ProfileCompletenessItem = {
  done: boolean;
  key: string;
  label: string;
};

type PublicStoryPayload = {
  action: string;
  id: string;
  result: string;
  situation: string;
  task: string;
  title: string;
  updatedAt: string;
};

type PublicProfilePayload = {
  displayName: string;
  headline: string | null;
  location: string | null;
  publicUrl: string;
  slug: string;
  summary: string | null;
  targetRoles: string[];
};

export type CandidateProfilePayload = {
  approvedStoriesCount: number;
  completeness: {
    completed: number;
    items: ProfileCompletenessItem[];
    percentage: number;
    total: number;
  };
  displayName: string;
  draftStoriesCount: number;
  headline: string | null;
  id: string;
  isPublic: boolean;
  location: string | null;
  publicReady: boolean;
  publicUrl: string;
  slug: string;
  summary: string | null;
  targetRoles: string[];
};

export type PublicProfileResponse = {
  approvedStories: PublicStoryPayload[];
  availability: 'missing' | 'ready' | 'training';
  fallbackMessage: string | null;
  profile: PublicProfilePayload | null;
  visitorToken: string;
};

export type ResolvedPublicProfile = PublicProfileResponse & {
  approvedStoryRecords: Story[];
  profileRecord: Profile | null;
  visitId: string | null;
};

const slugify = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'candidate';
};

const startCase = (value: string) => {
  return value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

const buildDisplayName = (user: SyncedLocalUser) => {
  const emailPrefix = user.email.split('@')[0] ?? user.id;
  return startCase(emailPrefix) || 'Candidate';
};

const buildPublicUrl = (slug: string) => {
  return new URL(`/p/${slug}`, env.clientOrigin).toString();
};

const createUniqueSlug = async (base: string) => {
  const normalizedBase = slugify(base);

  for (let index = 0; index < 100; index += 1) {
    const candidateSlug = index === 0 ? normalizedBase : `${normalizedBase}-${index + 1}`;
    const existingProfile = await prisma.profile.findUnique({
      where: {
        slug: candidateSlug,
      },
    });

    if (!existingProfile) {
      return candidateSlug;
    }
  }

  return `${normalizedBase}-${randomUUID().slice(0, 8)}`;
};

const mapPublicStory = (story: Story): PublicStoryPayload => {
  return {
    action: story.action,
    id: story.id,
    result: story.result,
    situation: story.situation,
    task: story.task,
    title: story.title,
    updatedAt: story.updatedAt.toISOString(),
  };
};

const buildCompleteness = (profile: Profile, approvedStoriesCount: number) => {
  const items: ProfileCompletenessItem[] = [
    {
      done: Boolean(profile.displayName?.trim()),
      key: 'display-name',
      label: 'Display name added',
    },
    {
      done: Boolean(profile.headline?.trim()),
      key: 'headline',
      label: 'Headline added',
    },
    {
      done: Boolean(profile.summary?.trim()),
      key: 'summary',
      label: 'Summary added',
    },
    {
      done: Boolean(profile.location?.trim()),
      key: 'location',
      label: 'Location added',
    },
    {
      done: profile.targetRoles.length > 0,
      key: 'target-roles',
      label: 'Target roles set',
    },
    {
      done: approvedStoriesCount > 0,
      key: 'approved-story',
      label: 'One approved STAR story',
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    completed,
    items,
    percentage,
    total,
  };
};

const buildCandidateProfilePayload = ({
  approvedStoriesCount,
  draftStoriesCount,
  profile,
}: {
  approvedStoriesCount: number;
  draftStoriesCount: number;
  profile: Profile;
}): CandidateProfilePayload => {
  const completeness = buildCompleteness(profile, approvedStoriesCount);
  const publicReady = profile.isPublic && approvedStoriesCount > 0 && completeness.percentage >= 50;

  return {
    approvedStoriesCount,
    completeness,
    displayName: profile.displayName?.trim() || 'Candidate',
    draftStoriesCount,
    headline: profile.headline,
    id: profile.id,
    isPublic: profile.isPublic,
    location: profile.location,
    publicReady,
    publicUrl: buildPublicUrl(profile.slug),
    slug: profile.slug,
    summary: profile.summary,
    targetRoles: profile.targetRoles,
  };
};

export const ensureCandidateProfile = async (user: SyncedLocalUser) => {
  const existingProfile = await prisma.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existingProfile) {
    return existingProfile;
  }

  return prisma.profile.create({
    data: {
      displayName: buildDisplayName(user),
      headline: 'Candidate AI profile in training',
      isPublic: false,
      slug: await createUniqueSlug(user.email.split('@')[0] ?? user.id),
      summary: null,
      userId: user.id,
    },
  });
};

export const getCandidateProfile = async (user: SyncedLocalUser): Promise<CandidateProfilePayload> => {
  const profile = await ensureCandidateProfile(user);
  const [approvedStoriesCount, draftStoriesCount] = await Promise.all([
    prisma.story.count({
      where: {
        status: 'approved',
        userId: user.id,
      },
    }),
    prisma.story.count({
      where: {
        status: 'draft',
        userId: user.id,
      },
    }),
  ]);

  return buildCandidateProfilePayload({
    approvedStoriesCount,
    draftStoriesCount,
    profile,
  });
};

export const updateCandidateProfile = async ({
  input,
  user,
}: {
  input: {
    displayName?: string | null;
    headline?: string | null;
    isPublic?: boolean;
    location?: string | null;
    summary?: string | null;
    targetRoles?: string[];
  };
  user: SyncedLocalUser;
}) => {
  const profile = await ensureCandidateProfile(user);
  const updatedProfile = await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      ...(input.displayName !== undefined ? { displayName: input.displayName?.trim() || null } : {}),
      ...(input.headline !== undefined ? { headline: input.headline?.trim() || null } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.location !== undefined ? { location: input.location?.trim() || null } : {}),
      ...(input.summary !== undefined ? { summary: input.summary?.trim() || null } : {}),
      ...(input.targetRoles !== undefined
        ? {
            targetRoles: input.targetRoles
              .map((role) => role.trim())
              .filter((role) => role.length > 0),
          }
        : {}),
    },
  });
  const [approvedStoriesCount, draftStoriesCount] = await Promise.all([
    prisma.story.count({
      where: {
        status: 'approved',
        userId: user.id,
      },
    }),
    prisma.story.count({
      where: {
        status: 'draft',
        userId: user.id,
      },
    }),
  ]);

  return buildCandidateProfilePayload({
    approvedStoriesCount,
    draftStoriesCount,
    profile: updatedProfile,
  });
};

const buildPublicProfilePayload = (profile: Profile): PublicProfilePayload => {
  return {
    displayName: profile.displayName?.trim() || 'Candidate',
    headline: profile.headline,
    location: profile.location,
    publicUrl: buildPublicUrl(profile.slug),
    slug: profile.slug,
    summary: profile.summary,
    targetRoles: profile.targetRoles,
  };
};

const resolveVisitorToken = (visitorToken?: string | null) => {
  const normalizedVisitorToken = visitorToken?.trim();
  return normalizedVisitorToken && normalizedVisitorToken.length > 0
    ? normalizedVisitorToken
    : randomUUID();
};

export const resolvePublicProfileBySlug = async ({
  referrer,
  slug,
  trackVisit,
  userAgent,
  visitorToken,
}: {
  referrer?: string | null;
  slug: string;
  trackVisit: boolean;
  userAgent?: string | null;
  visitorToken?: string | null;
}): Promise<ResolvedPublicProfile> => {
  const resolvedVisitorToken = resolveVisitorToken(visitorToken);
  const profile = await prisma.profile.findUnique({
    where: {
      slug,
    },
  });

  if (!profile) {
    return {
      approvedStories: [],
      approvedStoryRecords: [],
      availability: 'missing',
      fallbackMessage: 'This public AI profile does not exist.',
      profile: null,
      profileRecord: null,
      visitId: null,
      visitorToken: resolvedVisitorToken,
    };
  }

  const approvedStoryRecords = await prisma.story.findMany({
    where: {
      status: 'approved',
      userId: profile.userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 6,
  });
  const completeness = buildCompleteness(profile, approvedStoryRecords.length);
  const availability =
    profile.isPublic && approvedStoryRecords.length > 0 && completeness.percentage >= 50
      ? 'ready'
      : 'training';

  if (availability !== 'ready') {
    return {
      approvedStories: [],
      approvedStoryRecords,
      availability,
      fallbackMessage: 'This candidate is still training their public AI profile.',
      profile: null,
      profileRecord: profile,
      visitId: null,
      visitorToken: resolvedVisitorToken,
    };
  }

  let visitId: string | null = null;

  if (trackVisit) {
    const visit = await prisma.recruiterVisit.create({
      data: {
        profileId: profile.id,
        referrer: referrer?.slice(0, 240) || null,
        userAgent: userAgent?.slice(0, 240) || null,
        visitorToken: resolvedVisitorToken,
      },
    });

    visitId = visit.id;
  }

  return {
    approvedStories: approvedStoryRecords.map(mapPublicStory),
    approvedStoryRecords,
    availability,
    fallbackMessage: null,
    profile: buildPublicProfilePayload(profile),
    profileRecord: profile,
    visitId,
    visitorToken: resolvedVisitorToken,
  };
};

export const getPublicProfileResponse = async (params: {
  referrer?: string | null;
  slug: string;
  userAgent?: string | null;
  visitorToken?: string | null;
}): Promise<PublicProfileResponse> => {
  const resolvedProfile = await resolvePublicProfileBySlug({
    ...params,
    trackVisit: true,
  });

  return {
    approvedStories: resolvedProfile.approvedStories,
    availability: resolvedProfile.availability,
    fallbackMessage: resolvedProfile.fallbackMessage,
    profile: resolvedProfile.profile,
    visitorToken: resolvedProfile.visitorToken,
  };
};