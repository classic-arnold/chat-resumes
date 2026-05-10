# ChatResumes MVP Contract

This document locks the Phase 1 product and implementation contract for the MVP.

## Product Goal

Ship a paid candidate product where a candidate signs up, subscribes, trains a recruiter-facing AI profile through a private chat, and shares a public recruiter link that answers questions from approved profile content and approved STAR stories.

## Locked Decisions

- Auth provider: Clerk
- AI provider: OpenAI
- Initial model: GPT-5.4
- Architecture: React frontend in `web/`, Express backend in `backend/`
- Billing model: one paid subscription via Stripe Checkout
- Signed-in actor: candidate only
- Recruiter experience: anonymous public visitor
- Dashboard: candidate-facing only
- Public recruiter chat: AI chat with the candidate's approved profile content, not live chat with the candidate

## Roles

### Candidate

- Can sign up, log in, subscribe, access the dashboard, train their AI in private chat, and manage the public recruiter link.

### Recruiter

- Can visit the public recruiter route anonymously, read the candidate's public AI profile, and chat with that AI.
- Cannot log in, access candidate data, or view private chat history.

## Route Contract

| Route | Audience | Auth Required | Subscription Required | Purpose |
| --- | --- | --- | --- | --- |
| `/` | Public | No | No | Landing page and top-of-funnel conversion |
| `/pricing` | Public | No | No | Show the single paid plan and begin Stripe checkout |
| `/signup` | Public | No | No | Candidate signup through Clerk |
| `/login` | Public | No | No | Candidate login through Clerk |
| `/dashboard` | Candidate | Yes | Yes | Candidate home for billing, metrics, completeness, and public link |
| `/chat` | Candidate | Yes | Yes | Private AI authoring chat that collects and structures candidate stories |
| `/p/:slug` | Public | No | No | Public recruiter AI chat grounded on approved candidate content |
| `/billing/success` | Candidate | Yes | No | Stripe return route after successful checkout |
| `/billing/cancel` | Candidate | Yes | No | Stripe return route after canceled checkout |

## Access Rules

- Unauthenticated users may access `/`, `/pricing`, `/signup`, `/login`, and `/p/:slug` only.
- Authenticated but unsubscribed candidates may authenticate successfully but must be routed into pricing or billing completion before using `/dashboard` or `/chat`.
- Authenticated and subscribed candidates may access `/dashboard` and `/chat`.
- `/p/:slug` remains public even if the viewer is logged in.
- Invalid or inactive slugs must render a safe fallback state and never expose private candidate data.

## Public And Private Data Boundary

### Private candidate-only data

- Candidate account identity and Clerk identifiers
- Billing state beyond what the candidate sees in their own dashboard
- Full private chat transcripts from `/chat`
- Draft or rejected stories
- Internal AI prompts, system instructions, and moderation signals
- Raw recruiter analytics rows or internal abuse-detection signals

### Public recruiter-facing data

- Candidate public slug
- Candidate display name, headline, summary, and selected public profile fields
- Approved STAR stories only
- AI answers generated strictly from approved public profile content and approved STAR stories

### Enforcement rules

- The public recruiter route must never read directly from the raw private candidate transcript.
- Private candidate chat can inform public content only after structured extraction and explicit approval into public-ready fields or approved stories.
- If a candidate has not approved enough public content, the recruiter route must fall back to a limited profile state instead of improvising from private data.

## Core Entities

### User

- Purpose: local candidate record synced from Clerk
- Minimum fields: `id`, `clerkUserId`, `email`, `createdAt`, `updatedAt`

### Profile

- Purpose: candidate public profile and private completeness state
- Minimum fields: `id`, `userId`, `slug`, `displayName`, `headline`, `summary`, `location`, `targetRoles`, `isPublic`, `createdAt`, `updatedAt`

### Subscription

- Purpose: local billing state synced from Stripe
- Minimum fields: `id`, `userId`, `stripeCustomerId`, `stripeSubscriptionId`, `status`, `currentPeriodEnd`, `createdAt`, `updatedAt`

### CandidateChatSession

- Purpose: a private AI intake thread for the candidate
- Minimum fields: `id`, `userId`, `status`, `startedAt`, `endedAt`, `createdAt`, `updatedAt`

### CandidateChatMessage

- Purpose: persisted message stream for the private candidate chat
- Minimum fields: `id`, `sessionId`, `role`, `content`, `createdAt`

### Story

- Purpose: normalized STAR story extracted from candidate chat
- Minimum fields: `id`, `userId`, `title`, `situation`, `task`, `action`, `result`, `sourceSessionId`, `status`, `createdAt`, `updatedAt`
- Status values: `draft`, `approved`, `archived`

### RecruiterVisit

- Purpose: page-level analytics for the public recruiter route
- Minimum fields: `id`, `profileId`, `visitorToken`, `referrer`, `userAgent`, `visitedAt`

### RecruiterChatSession

- Purpose: a public recruiter AI chat session on `/p/:slug`
- Minimum fields: `id`, `profileId`, `visitId`, `visitorToken`, `startedAt`, `endedAt`, `createdAt`, `updatedAt`

### RecruiterChatMessage

- Purpose: persisted public recruiter chat messages
- Minimum fields: `id`, `sessionId`, `role`, `content`, `createdAt`

## API Surface Contract

These are the first backend surfaces the frontend can build against.

### Auth

- `GET /api/auth/session`
- Purpose: return current candidate auth state and local user bootstrap state
- Returns: `isAuthenticated`, `user`, `hasActiveSubscription`

### Billing status

- `GET /api/billing/status`
- Purpose: return subscription status for the signed-in candidate
- Returns: `status`, `currentPeriodEnd`, `customerPortalUrl` or a flag to request one

### Checkout session creation

- `POST /api/billing/checkout-session`
- Purpose: create a Stripe Checkout session for the signed-in candidate
- Input: optional success and cancel URLs
- Returns: `checkoutUrl` or Stripe session identifier

### Billing portal

- `POST /api/billing/portal-session`
- Purpose: create a Stripe Billing Portal session for the signed-in candidate
- Returns: `portalUrl`

### Stripe webhook

- `POST /api/stripe/webhooks`
- Purpose: receive Stripe subscription lifecycle events and sync local billing state
- Requirements: raw body handling, signature verification, idempotency

### Candidate profile

- `GET /api/profile`
- Purpose: return the signed-in candidate profile and completeness state
- Returns: private dashboard-safe profile payload

- `PATCH /api/profile`
- Purpose: update candidate profile fields that are not chat-derived

### Public recruiter profile

- `GET /api/public/profiles/:slug`
- Purpose: return the recruiter-safe public profile for the share link
- Returns: display fields, approved stories, and public availability state

### Dashboard metrics

- `GET /api/dashboard`
- Purpose: return the candidate dashboard summary
- Returns: billing summary, public link, profile completeness, views, recruiter chat metrics

### Candidate chat websocket

- Transport: Socket.IO namespace or event channel for authenticated candidates
- Purpose: private authoring chat between candidate and AI
- Required events: connect, candidate message, AI reply, session resume, error
- Persistence rule: every message must be stored before the session is considered complete

### Recruiter chat websocket

- Transport: Socket.IO namespace or event channel for public recruiter chats
- Purpose: recruiter chat with the candidate's AI profile
- Required events: connect, recruiter message, AI reply, session start, session end, error
- Grounding rule: answers may use only recruiter-safe public content

## Dashboard Contract

The candidate dashboard should contain only the following blocks for MVP.

- Subscription status
- Public recruiter link
- Public traffic metrics
- Recruiter chat activity metrics
- Profile completeness
- Primary action back to `/chat`

Anything outside those outcomes is out of scope for the first launch.

## Success Criteria

- A candidate can sign up, subscribe, and reach the dashboard.
- A candidate can create at least one approved STAR story through the private AI chat.
- A recruiter can open the public link and chat anonymously with the candidate's AI.
- The dashboard reflects subscription state, traffic, recruiter chat activity, and completeness.
- Public answers never expose private transcript content.