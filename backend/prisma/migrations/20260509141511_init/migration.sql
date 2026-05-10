-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- CreateEnum
CREATE TYPE "CandidateChatSessionStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "RecruiterChatRole" AS ENUM ('recruiter', 'ai');

-- CreateEnum
CREATE TYPE "CandidateChatRole" AS ENUM ('candidate', 'ai', 'system');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('draft', 'approved', 'archived');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'incomplete',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CandidateChatSessionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "CandidateChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceSessionId" TEXT,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterVisit" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "visitorToken" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterChatSession" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "visitId" TEXT,
    "visitorToken" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "RecruiterChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "CandidateChatSession_userId_createdAt_idx" ON "CandidateChatSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CandidateChatMessage_sessionId_createdAt_idx" ON "CandidateChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "Story_userId_status_idx" ON "Story"("userId", "status");

-- CreateIndex
CREATE INDEX "RecruiterVisit_profileId_visitedAt_idx" ON "RecruiterVisit"("profileId", "visitedAt");

-- CreateIndex
CREATE INDEX "RecruiterVisit_visitorToken_idx" ON "RecruiterVisit"("visitorToken");

-- CreateIndex
CREATE INDEX "RecruiterChatSession_profileId_createdAt_idx" ON "RecruiterChatSession"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruiterChatSession_visitorToken_idx" ON "RecruiterChatSession"("visitorToken");

-- CreateIndex
CREATE INDEX "RecruiterChatMessage_sessionId_createdAt_idx" ON "RecruiterChatMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateChatSession" ADD CONSTRAINT "CandidateChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateChatMessage" ADD CONSTRAINT "CandidateChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CandidateChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_sourceSessionId_fkey" FOREIGN KEY ("sourceSessionId") REFERENCES "CandidateChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterVisit" ADD CONSTRAINT "RecruiterVisit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterChatSession" ADD CONSTRAINT "RecruiterChatSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterChatSession" ADD CONSTRAINT "RecruiterChatSession_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "RecruiterVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterChatMessage" ADD CONSTRAINT "RecruiterChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecruiterChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

