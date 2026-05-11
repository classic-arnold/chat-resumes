import { ApiError } from '../middleware/api-error-handler.js';
import { generateAssistantReply } from '../lib/ai.js';
import { prisma } from '../lib/prisma.js';
import { buildDocumentContextForUser } from './documents.js';
import { ensureCandidateProfile, getCandidateProfile, resolvePublicProfileBySlug, buildQuizAnswersContext, parseQuizAnswers, type CandidateProfilePayload, type PublicProfileResponse } from './profiles.js';
import type { SyncedLocalUser } from './users.js';

type ChatMessagePayload = {
  content: string;
  createdAt: string;
  id: string;
  role: 'ai' | 'candidate' | 'recruiter' | 'system';
};

type StoryPayload = {
  action: string;
  id: string;
  result: string;
  situation: string;
  sourceSessionId: string | null;
  status: 'approved' | 'archived' | 'draft';
  task: string;
  title: string;
  updatedAt: string;
};

export type CandidateChatState = {
  knowledgeFacts: string[];
  messages: ChatMessagePayload[];
  profile: CandidateProfilePayload;
  sessionId: string;
  stories: StoryPayload[];
  summary: string;
};

export type RecruiterChatState = PublicProfileResponse & {
  messages: ChatMessagePayload[];
  sessionId: string | null;
};

const candidateStarterMessage =
  'Let\'s build a recruiter-safe story bank. Start with the highest-stakes example you want your public AI to handle well.';

const candidateReplyLibrary = [
  {
    keywords: ['star', 'story', 'storyline'],
    reply:
      'Lock the STAR shape. Tell me what was at risk, what you personally owned, what action you drove, and what changed because of you.',
  },
  {
    keywords: ['result', 'metric', 'impact', 'measure'],
    reply:
      'The result still sounds soft. I need the before state, the outcome, and at least one proof point such as time saved, launch acceleration, or a business metric.',
  },
  {
    keywords: ['stakeholder', 'alignment', 'conflict', 'pushback'],
    reply:
      'Name the conflicting stakeholders, the tradeoff you made, and why your call held under pressure. That is usually the most recruiter-relevant part.',
  },
  {
    keywords: ['role', 'staff', 'scope', 'next'],
    reply:
      'Frame it as credibility, not preference. What scope do you want next, and which concrete example proves you can already operate there?',
  },
];

const recruiterRateLimit = new Map<string, { count: number; windowStartedAt: number }>();

const mapMessage = (message: {
  content: string;
  createdAt: Date;
  id: string;
  role: 'ai' | 'candidate' | 'recruiter' | 'system';
}): ChatMessagePayload => {
  return {
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
    role: message.role,
  };
};

const mapStory = (story: {
  action: string;
  id: string;
  result: string;
  situation: string;
  sourceSessionId: string | null;
  status: 'approved' | 'archived' | 'draft';
  task: string;
  title: string;
  updatedAt: Date;
}): StoryPayload => {
  return {
    action: story.action,
    id: story.id,
    result: story.result,
    situation: story.situation,
    sourceSessionId: story.sourceSessionId,
    status: story.status,
    task: story.task,
    title: story.title,
    updatedAt: story.updatedAt.toISOString(),
  };
};

const buildKnowledgeFacts = ({
  documentNames,
  profile,
  stories,
}: {
  documentNames: string[];
  profile: CandidateProfilePayload;
  stories: StoryPayload[];
}) => {
  const facts = [
    profile.headline ? `Headline: ${profile.headline}` : null,
    profile.location ? `Location: ${profile.location}` : null,
    profile.targetRoles.length > 0 ? `Target roles: ${profile.targetRoles.join(', ')}` : null,
    documentNames.length > 0
      ? `${documentNames.length} document${documentNames.length === 1 ? '' : 's'} ingested: ${documentNames.slice(0, 3).join(', ')}${documentNames.length > 3 ? '…' : ''}`
      : null,
    profile.approvedStoriesCount > 0 ? `${profile.approvedStoriesCount} approved recruiter-safe story${profile.approvedStoriesCount === 1 ? '' : 's'}` : null,
    profile.draftStoriesCount > 0 ? `${profile.draftStoriesCount} draft story${profile.draftStoriesCount === 1 ? '' : 's'} in progress` : null,
    stories[0] ? `Latest story: ${stories[0].title}` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return facts.length > 0
    ? facts
    : ['No structured story data yet. Start with one concrete example and the AI will extract it into a draft.'];
};

const buildChatSummary = ({
  profile,
  stories,
}: {
  profile: CandidateProfilePayload;
  stories: StoryPayload[];
}) => {
  if (stories.length === 0) {
    return 'Your AI does not have any structured STAR stories yet. Use this chat to capture one strong story and approve it for the public route.';
  }

  if (profile.publicReady) {
    return 'Your public recruiter AI has enough approved content to answer grounded questions. Keep sharpening the language and adding stories.';
  }

  return 'You have structured story content, but the public AI still needs more approved signal before it is fully shareable.';
};

const extractSentences = (messages: string[]) => {
  return messages
    .flatMap((message) => message.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
};

const findSentence = (sentences: string[], pattern: RegExp) => {
  return sentences.find((sentence) => pattern.test(sentence));
};

const truncate = (value: string, maxLength: number) => {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}…`;
};

const buildDraftStory = (candidateMessages: string[]) => {
  if (candidateMessages.length === 0) {
    return null;
  }

  const sentences = extractSentences(candidateMessages);
  const firstSentence = sentences[0] ?? candidateMessages[0];
  const title = truncate(
    firstSentence
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 7)
      .join(' '),
    64,
  );
  const situation =
    findSentence(sentences, /(problem|risk|deadline|conflict|broken|before|challenge|pressure)/i) ??
    firstSentence;
  const task =
    findSentence(sentences, /(owned|responsible|accountable|needed to|had to|my role)/i) ??
    candidateMessages[0];
  const action =
    findSentence(sentences, /(led|built|created|drove|launched|designed|negotiated|aligned|shipped|implemented|rolled out)/i) ??
    candidateMessages[candidateMessages.length - 1];
  const result =
    findSentence(sentences, /(\d|percent|week|month|day|revenue|saved|faster|increase|decrease|grew|improved|early)/i) ??
    '';

  return {
    action: action.trim(),
    result: result.trim(),
    situation: situation.trim(),
    task: task.trim(),
    title: title || 'Candidate story draft',
  };
};

const buildCandidateReply = ({
  content,
  storyDraft,
}: {
  content: string;
  storyDraft: ReturnType<typeof buildDraftStory>;
}) => {
  const normalizedContent = content.toLowerCase();
  const matchedReply = candidateReplyLibrary.find(({ keywords }) =>
    keywords.some((keyword) => normalizedContent.includes(keyword)),
  );

  if (matchedReply) {
    return matchedReply.reply;
  }

  const missingFields = [
    !storyDraft?.situation ? 'what was broken or at risk' : null,
    !storyDraft?.task ? 'what you personally owned' : null,
    !storyDraft?.action ? 'the action or decision you drove' : null,
    !storyDraft?.result ? 'a measurable result' : null,
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length > 0) {
    return `Good start. I still need ${missingFields.join(', ')}. Give me those in concrete terms so I can convert this into a stronger recruiter-safe STAR story.`;
  }

  return 'This is close to recruiter-safe. Tighten the business result, then approve the draft when the wording feels strong enough to publish.';
};

const formatConversationHistory = (
  messages: Array<{
    content: string;
    role: 'ai' | 'candidate' | 'recruiter' | 'system';
  }>,
) => {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n');
};

const formatDraftStory = (storyDraft: ReturnType<typeof buildDraftStory>) => {
  if (!storyDraft) {
    return 'No structured draft extracted yet.';
  }

  return [
    `Title: ${storyDraft.title}`,
    `Situation: ${storyDraft.situation || '[missing]'}`,
    `Task: ${storyDraft.task || '[missing]'}`,
    `Action: ${storyDraft.action || '[missing]'}`,
    `Result: ${storyDraft.result || '[missing]'}`,
  ].join('\n');
};

const buildCandidatePrompt = ({
  content,
  documentContext,
  profile,
  recentMessages,
  storyDraft,
}: {
  content: string;
  documentContext: string;
  profile: CandidateProfilePayload;
  recentMessages: Array<{
    content: string;
    role: 'ai' | 'candidate' | 'recruiter' | 'system';
  }>;
  storyDraft: ReturnType<typeof buildDraftStory>;
}) => {
  const profileFacts = [
    profile.displayName ? `Display name: ${profile.displayName}` : null,
    profile.headline ? `Headline: ${profile.headline}` : null,
    profile.location ? `Location: ${profile.location}` : null,
    profile.targetRoles.length > 0 ? `Target roles: ${profile.targetRoles.join(', ')}` : null,
    `Approved stories: ${profile.approvedStoriesCount}`,
    `Draft stories: ${profile.draftStoriesCount}`,
  ]
    .filter((fact): fact is string => Boolean(fact))
    .join('\n');

  const conversationHistory = truncate(formatConversationHistory(recentMessages), 6_000);
  const groundedDocumentContext = documentContext
    ? truncate(documentContext, 12_000)
    : 'No uploaded document context.';

  return {
    systemPrompt: [
      'You are ChatResumes, a sharp private AI coach for candidates.',
      'Your job is to turn raw experience into recruiter-safe STAR stories and stronger candidate positioning.',
      'Use only the provided conversation, profile facts, and uploaded document context.',
      'Never invent metrics, company names, timelines, roles, or outcomes.',
      'If information is missing, ask directly for the missing risk, ownership, action, or measurable result.',
      'Keep replies concise and practical, usually 2 to 4 sentences.',
      'If the candidate asks for a STAR rewrite, provide Situation, Task, Action, and Result labels.',
      'Push for personal ownership and measurable business impact.',
    ].join(' '),
    userPrompt: [
      'Candidate profile facts:',
      profileFacts || 'No structured profile facts yet.',
      '',
      'Current extracted draft:',
      formatDraftStory(storyDraft),
      '',
      'Uploaded document context:',
      groundedDocumentContext,
      '',
      'Recent conversation:',
      conversationHistory || 'No prior messages.',
      '',
      `Latest candidate message: ${content}`,
      '',
      'Write the next assistant reply only.',
    ].join('\n'),
  };
};

const generateCandidateReply = async ({
  content,
  documentContext,
  profile,
  recentMessages,
  storyDraft,
}: {
  content: string;
  documentContext: string;
  profile: CandidateProfilePayload;
  recentMessages: Array<{
    content: string;
    role: 'ai' | 'candidate' | 'recruiter' | 'system';
  }>;
  storyDraft: ReturnType<typeof buildDraftStory>;
}) => {
  const prompt = buildCandidatePrompt({
    content,
    documentContext,
    profile,
    recentMessages,
    storyDraft,
  });
  const aiReply = await generateAssistantReply(prompt);

  return aiReply ?? buildCandidateReply({ content, storyDraft });
};

const getOrCreateCandidateSession = async (userId: string) => {
  const activeSession = await prisma.candidateChatSession.findFirst({
    where: {
      status: 'active',
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (activeSession) {
    return activeSession;
  }

  return prisma.candidateChatSession.create({
    data: {
      userId,
    },
  });
};

const seedCandidateSessionIfEmpty = async (sessionId: string) => {
  const existingMessageCount = await prisma.candidateChatMessage.count({
    where: {
      sessionId,
    },
  });

  if (existingMessageCount > 0) {
    return;
  }

  await prisma.candidateChatMessage.create({
    data: {
      content: candidateStarterMessage,
      role: 'ai',
      sessionId,
    },
  });
};

const getCandidateStories = async (userId: string) => {
  const stories = await prisma.story.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        updatedAt: 'desc',
      },
    ],
    take: 8,
  });

  return stories.map(mapStory);
};

const upsertDraftStoryForSession = async ({
  draftStory,
  sessionId,
  userId,
}: {
  draftStory: NonNullable<ReturnType<typeof buildDraftStory>>;
  sessionId: string;
  userId: string;
}) => {
  const existingDraft = await prisma.story.findFirst({
    where: {
      sourceSessionId: sessionId,
      status: 'draft',
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (existingDraft) {
    return prisma.story.update({
      where: {
        id: existingDraft.id,
      },
      data: draftStory,
    });
  }

  return prisma.story.create({
    data: {
      ...draftStory,
      sourceSessionId: sessionId,
      userId,
    },
  });
};

export const getCandidateChatState = async (user: SyncedLocalUser): Promise<CandidateChatState> => {
  await ensureCandidateProfile(user);
  const session = await getOrCreateCandidateSession(user.id);
  await seedCandidateSessionIfEmpty(session.id);

  const [hydratedSession, profile, stories, documentContext, documentRecords] = await Promise.all([
    prisma.candidateChatSession.findUniqueOrThrow({
      where: {
        id: session.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    }),
    getCandidateProfile(user),
    getCandidateStories(user.id),
    buildDocumentContextForUser(user.id),
    prisma.document.findMany({
      where: { userId: user.id, status: 'ready' },
      orderBy: { createdAt: 'asc' },
      select: { originalName: true },
    }),
  ]);

  // documentContext is reserved for future LLM grounding; surfaced via knowledgeFacts for now.
  void documentContext;
  const documentNames = documentRecords.map((document) => document.originalName);

  return {
    knowledgeFacts: buildKnowledgeFacts({ documentNames, profile, stories }),
    messages: hydratedSession.messages.map(mapMessage),
    profile,
    sessionId: hydratedSession.id,
    stories,
    summary: buildChatSummary({ profile, stories }),
  };
};

export const processCandidateChatTurn = async ({
  content,
  user,
}: {
  content: string;
  user: SyncedLocalUser;
}) => {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new ApiError({
      code: 'candidate_message_empty',
      message: 'The candidate message cannot be empty.',
      statusCode: 400,
    });
  }

  const session = await getOrCreateCandidateSession(user.id);
  await prisma.candidateChatMessage.create({
    data: {
      content: trimmedContent,
      role: 'candidate',
      sessionId: session.id,
    },
  });

  const candidateMessages = await prisma.candidateChatMessage.findMany({
    where: {
      role: 'candidate',
      sessionId: session.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const draftStory = buildDraftStory(candidateMessages.map((message) => message.content));

  if (draftStory) {
    await upsertDraftStoryForSession({
      draftStory,
      sessionId: session.id,
      userId: user.id,
    });
  }

  const [profile, recentMessages, documentContext, profileRecord] = await Promise.all([
    getCandidateProfile(user),
    prisma.candidateChatMessage.findMany({
      where: {
        sessionId: session.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    }),
    buildDocumentContextForUser(user.id),
    prisma.profile.findUnique({ where: { userId: user.id }, select: { quizAnswers: true } }),
  ]);
  const quizContext = buildQuizAnswersContext(parseQuizAnswers(profileRecord?.quizAnswers));
  const groundedContext = [quizContext, documentContext].filter((part) => part && part.length > 0).join('\n\n');
  const aiReply = await generateCandidateReply({
    content: trimmedContent,
    documentContext: groundedContext,
    profile,
    recentMessages: recentMessages.reverse(),
    storyDraft: draftStory,
  });

  await prisma.candidateChatMessage.create({
    data: {
      content: aiReply,
      role: 'ai',
      sessionId: session.id,
    },
  });

  return getCandidateChatState(user);
};

export const approveCandidateStory = async ({
  storyId,
  user,
}: {
  storyId: string;
  user: SyncedLocalUser;
}) => {
  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      userId: user.id,
    },
  });

  if (!story) {
    throw new ApiError({
      code: 'story_not_found',
      message: 'The requested story draft does not exist.',
      statusCode: 404,
    });
  }

  await prisma.story.update({
    where: {
      id: story.id,
    },
    data: {
      status: 'approved',
    },
  });
  await prisma.profile.update({
    where: {
      userId: user.id,
    },
    data: {
      isPublic: true,
    },
  });

  return getCandidateChatState(user);
};

const getOrCreateRecruiterSession = async ({
  profileId,
  visitId,
  visitorToken,
}: {
  profileId: string;
  visitId: string | null;
  visitorToken: string;
}) => {
  const activeSession = await prisma.recruiterChatSession.findFirst({
    where: {
      endedAt: null,
      profileId,
      visitorToken,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (activeSession) {
    if (visitId && activeSession.visitId !== visitId) {
      return prisma.recruiterChatSession.update({
        where: {
          id: activeSession.id,
        },
        data: {
          visitId,
        },
      });
    }

    return activeSession;
  }

  return prisma.recruiterChatSession.create({
    data: {
      profileId,
      visitId,
      visitorToken,
    },
  });
};

const getLatestVisitId = async ({
  profileId,
  visitorToken,
}: {
  profileId: string;
  visitorToken: string;
}) => {
  const latestVisit = await prisma.recruiterVisit.findFirst({
    where: {
      profileId,
      visitorToken,
    },
    orderBy: {
      visitedAt: 'desc',
    },
  });

  return latestVisit?.id ?? null;
};

const seedRecruiterSessionIfEmpty = async ({
  profile,
  sessionId,
}: {
  profile: NonNullable<PublicProfileResponse['profile']>;
  sessionId: string;
}) => {
  const existingMessageCount = await prisma.recruiterChatMessage.count({
    where: {
      sessionId,
    },
  });

  if (existingMessageCount > 0) {
    return;
  }

  const intro = `Hi, I\'m ${profile.displayName}\'s recruiter-facing AI profile. Ask about experience, leadership, target roles, or the approved stories below.`;
  await prisma.recruiterChatMessage.create({
    data: {
      content: intro,
      role: 'ai',
      sessionId,
    },
  });
};

const buildRecruiterReply = ({
  approvedStories,
  profile,
  question,
}: {
  approvedStories: PublicProfileResponse['approvedStories'];
  profile: NonNullable<PublicProfileResponse['profile']>;
  question: string;
}) => {
  const normalizedQuestion = question.toLowerCase();

  if (/(location|based|remote)/i.test(normalizedQuestion) && profile.location) {
    return `${profile.displayName} is based in ${profile.location}.`;
  }

  if (/(role|roles|looking for|next)/i.test(normalizedQuestion) && profile.targetRoles.length > 0) {
    return `${profile.displayName} is targeting ${profile.targetRoles.join(', ')} roles.`;
  }

  if (/(summary|background|about|headline)/i.test(normalizedQuestion) && (profile.summary || profile.headline)) {
    return [profile.headline, profile.summary].filter(Boolean).join(' ');
  }

  const matchedStory = approvedStories.find((story) => {
    const searchableContent = `${story.title} ${story.situation} ${story.task} ${story.action} ${story.result}`.toLowerCase();
    return normalizedQuestion
      .split(/\s+/)
      .filter((token) => token.length > 3)
      .some((token) => searchableContent.includes(token));
  });

  if (matchedStory) {
    return `${matchedStory.title}: ${matchedStory.situation} ${matchedStory.task} ${matchedStory.action} ${matchedStory.result}`;
  }

  if (approvedStories[0]) {
    const story = approvedStories[0];
    return `Based on approved material, ${profile.displayName} has a strong example in ${story.title}. ${story.action} ${story.result}`;
  }

  return `I can only answer from approved public content. Right now I have ${profile.displayName}\'s public profile headline and target role information available.`;
};

const formatApprovedStories = (approvedStories: PublicProfileResponse['approvedStories']) => {
  if (approvedStories.length === 0) {
    return 'No approved stories available.';
  }

  return approvedStories
    .map(
      (story, index) =>
        `${index + 1}. ${story.title}\nSituation: ${story.situation}\nTask: ${story.task}\nAction: ${story.action}\nResult: ${story.result}`,
    )
    .join('\n\n');
};

const generateRecruiterReply = async ({
  approvedStories,
  profile,
  question,
  quizContext,
  recentMessages,
}: {
  approvedStories: PublicProfileResponse['approvedStories'];
  profile: NonNullable<PublicProfileResponse['profile']>;
  question: string;
  quizContext: string;
  recentMessages: Array<{
    content: string;
    role: 'ai' | 'candidate' | 'recruiter' | 'system';
  }>;
}) => {
  const conversationHistory = truncate(formatConversationHistory(recentMessages), 4_500);
  const aiReply = await generateAssistantReply({
    systemPrompt: [
      'You are the public recruiter-facing AI for a candidate profile on ChatResumes.',
      'Answer only from the approved public profile facts, intake answers, and approved stories provided to you.',
      'Do not invent or infer private information, hidden context, or unapproved claims.',
      'If the answer is not grounded in the approved content, say you do not have enough approved public material to answer that yet.',
      'Keep answers recruiter-safe, concrete, and concise, usually 2 to 4 sentences.',
    ].join(' '),
    userPrompt: [
      'Public profile:',
      `Display name: ${profile.displayName}`,
      `Headline: ${profile.headline ?? 'Not provided'}`,
      `Location: ${profile.location ?? 'Not provided'}`,
      `Summary: ${profile.summary ?? 'Not provided'}`,
      `Target roles: ${profile.targetRoles.join(', ') || 'Not provided'}`,
      '',
      quizContext || 'Candidate intake answers: none provided.',
      '',
      'Approved stories:',
      formatApprovedStories(approvedStories),
      '',
      'Recent conversation:',
      conversationHistory || 'No prior recruiter messages.',
      '',
      `Latest recruiter question: ${question}`,
      '',
      'Write the next assistant reply only.',
    ].join('\n'),
  });

  return (
    aiReply ??
    buildRecruiterReply({
      approvedStories,
      profile,
      question,
    })
  );
};

const assertRecruiterRateLimit = (visitorToken: string) => {
  const windowStartedAt = Date.now() - 60_000;
  const currentWindow = recruiterRateLimit.get(visitorToken);

  if (!currentWindow || currentWindow.windowStartedAt < windowStartedAt) {
    recruiterRateLimit.set(visitorToken, {
      count: 1,
      windowStartedAt: Date.now(),
    });
    return;
  }

  if (currentWindow.count >= 20) {
    throw new ApiError({
      code: 'recruiter_rate_limited',
      message: 'Too many recruiter messages were sent too quickly. Please slow down and try again shortly.',
      statusCode: 429,
    });
  }

  recruiterRateLimit.set(visitorToken, {
    count: currentWindow.count + 1,
    windowStartedAt: currentWindow.windowStartedAt,
  });
};

export const getRecruiterChatState = async ({
  referrer,
  slug,
  userAgent,
  visitorToken,
}: {
  referrer?: string | null;
  slug: string;
  trackVisit?: boolean;
  userAgent?: string | null;
  visitorToken?: string | null;
}): Promise<RecruiterChatState> => {
  const publicProfile = await resolvePublicProfileBySlug({
    referrer,
    slug,
    trackVisit: false,
    userAgent,
    visitorToken,
  });

  if (publicProfile.availability !== 'ready' || !publicProfile.profileRecord || !publicProfile.profile) {
    return {
      approvedStories: publicProfile.approvedStories,
      availability: publicProfile.availability,
      fallbackMessage: publicProfile.fallbackMessage,
      messages: [],
      profile: publicProfile.profile,
      sessionId: null,
      visitorToken: publicProfile.visitorToken,
    };
  }

  const visitId = publicProfile.visitId ?? (await getLatestVisitId({
    profileId: publicProfile.profileRecord.id,
    visitorToken: publicProfile.visitorToken,
  }));

  const session = await getOrCreateRecruiterSession({
    profileId: publicProfile.profileRecord.id,
    visitId,
    visitorToken: publicProfile.visitorToken,
  });
  await seedRecruiterSessionIfEmpty({
    profile: publicProfile.profile,
    sessionId: session.id,
  });

  const hydratedSession = await prisma.recruiterChatSession.findUniqueOrThrow({
    where: {
      id: session.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return {
    approvedStories: publicProfile.approvedStories,
    availability: publicProfile.availability,
    fallbackMessage: publicProfile.fallbackMessage,
    messages: hydratedSession.messages.map(mapMessage),
    profile: publicProfile.profile,
    sessionId: hydratedSession.id,
    visitorToken: publicProfile.visitorToken,
  };
};

export const processRecruiterChatTurn = async ({
  content,
  referrer,
  slug,
  userAgent,
  visitorToken,
}: {
  content: string;
  referrer?: string | null;
  slug: string;
  userAgent?: string | null;
  visitorToken?: string | null;
}) => {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new ApiError({
      code: 'recruiter_message_empty',
      message: 'The recruiter message cannot be empty.',
      statusCode: 400,
    });
  }

  const publicProfile = await resolvePublicProfileBySlug({
    referrer,
    slug,
    trackVisit: false,
    userAgent,
    visitorToken,
  });

  if (publicProfile.availability !== 'ready' || !publicProfile.profileRecord || !publicProfile.profile) {
    throw new ApiError({
      code: 'public_profile_unavailable',
      message: publicProfile.fallbackMessage ?? 'This public AI profile is not ready yet.',
      statusCode: 409,
    });
  }

  assertRecruiterRateLimit(publicProfile.visitorToken);

  const visitId = publicProfile.visitId ?? (await getLatestVisitId({
    profileId: publicProfile.profileRecord.id,
    visitorToken: publicProfile.visitorToken,
  }));

  const session = await getOrCreateRecruiterSession({
    profileId: publicProfile.profileRecord.id,
    visitId,
    visitorToken: publicProfile.visitorToken,
  });

  await prisma.recruiterChatMessage.create({
    data: {
      content: trimmedContent,
      role: 'recruiter',
      sessionId: session.id,
    },
  });

  const recentMessages = await prisma.recruiterChatMessage.findMany({
    where: {
      sessionId: session.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  const aiReply = await generateRecruiterReply({
    approvedStories: publicProfile.approvedStories,
    profile: publicProfile.profile,
    question: trimmedContent,
    quizContext: buildQuizAnswersContext(parseQuizAnswers(publicProfile.profileRecord.quizAnswers)),
    recentMessages: recentMessages.reverse(),
  });

  await prisma.recruiterChatMessage.create({
    data: {
      content: aiReply,
      role: 'ai',
      sessionId: session.id,
    },
  });
  await prisma.recruiterChatSession.update({
    where: {
      id: session.id,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return getRecruiterChatState({
    referrer,
    slug,
    userAgent,
    visitorToken: publicProfile.visitorToken,
  });
};

export const endRecruiterSession = async (sessionId: string) => {
  await prisma.recruiterChatSession.update({
    where: {
      id: sessionId,
    },
    data: {
      endedAt: new Date(),
    },
  });
};