# ChatResumes MVP To-Do

This file is the execution plan for the MVP. The goal is to ship a paid candidate product with a public recruiter AI route, not to expand scope.

## Locked MVP Decisions

- [x] The candidate is the only signed-in user.
- [x] Recruiters are anonymous visitors.
- [x] There is only one dashboard, and it is candidate-facing.
- [x] Auth will be managed, not custom-built in Express.
- [x] Billing is a single paid Stripe subscription for launch.
- [x] The current React frontend + Express backend architecture stays in place.
- [x] The public recruiter route is an AI chat with the candidate's profile, not live chat with the candidate.
- [x] The dashboard stays minimal and shows public traffic plus profile completeness.
- [x] Confirm the exact auth vendor. Default recommendation: Clerk. Yes, Clerk.
- [x] Confirm the initial AI provider and model. Default recommendation: one provider only for MVP. OpenAI GPT 5.4.

## Route Map To Ship

- [x] `/` landing page
- [ ] `/pricing` pricing page with real subscribe CTA
- [ ] `/signup` managed auth signup flow
- [ ] `/login` managed auth login flow
- [ ] `/dashboard` candidate dashboard with live data
- [ ] `/chat` private candidate AI authoring chat
- [ ] `/p/:slug` public recruiter AI chat route
- [ ] `/billing/success` Stripe success callback
- [ ] `/billing/cancel` Stripe cancel callback

## Not In MVP

- [x] Recruiter accounts
- [x] Internal admin or webmaster dashboard
- [x] Live recruiter-to-candidate messaging
- [x] Multiple pricing tiers
- [x] Resume parsing pipeline
- [x] Separate editing surface outside the candidate chat flow

## Build Order

### 1. Lock the app contract

- [ ] Freeze access rules for every route.
- [ ] Freeze the public/private data boundary.
- [ ] Freeze the core entities: user, profile, public slug, subscription, candidate chat session, candidate chat message, approved story, recruiter visit, recruiter chat session, recruiter chat message.
- [ ] Write down the API surfaces before wiring UI: auth session check, billing status, checkout session creation, public profile fetch, candidate chat, recruiter chat, dashboard metrics.

### 2. Backend foundation

- [ ] Add Postgres to the architecture.
- [ ] Add Prisma to the backend workspace.
- [ ] Create the first Prisma schema and migration set.
- [ ] Add environment validation for database, auth, Stripe, AI, websocket, and app URLs.
- [ ] Refactor the Express app so API routes, Stripe webhooks, and Socket.IO can be mounted cleanly.
- [ ] Add a shared error-handling pattern for API routes.
- [ ] Add request logging for API and websocket activity.

### 3. Authentication

- [ ] Integrate the chosen managed auth provider in the web app.
- [ ] Replace the placeholder signup page with a real signup flow.
- [ ] Replace the placeholder login page with a real login flow.
- [ ] Add protected-route handling for `/dashboard` and `/chat`.
- [ ] Verify auth tokens or sessions in Express.
- [ ] Create or sync the local user record after first signup.

### 4. Pricing and Stripe billing

- [ ] Create a real pricing page in the web app.
- [ ] Show one clear paid plan with a single subscribe CTA.
- [ ] Add backend endpoint to create a Stripe Checkout session.
- [ ] Create Stripe customer records tied to local users.
- [ ] Add Stripe webhook handling with idempotency.
- [ ] Persist subscription state locally.
- [ ] Add billing success and cancel routes in the frontend.
- [ ] Add a billing status card and billing portal link in the dashboard.

### 5. Candidate AI authoring chat

- [ ] Rework `/chat` from demo mode into the private candidate chat.
- [ ] Add Socket.IO to the Express server.
- [ ] Add websocket connection handling in the web app.
- [ ] Persist candidate chat sessions and messages.
- [ ] Add AI orchestration that pushes for strong STAR stories.
- [ ] Extract and store structured story fields: situation, task, action, result.
- [ ] Mark stories as draft or approved for public use.
- [ ] Show a minimal "what your AI knows so far" summary in chat or dashboard.

### 6. Public recruiter AI route

- [ ] Create `/p/:slug` as a separate public route.
- [ ] Load the candidate's approved public profile by slug.
- [ ] Add recruiter-side websocket chat for the public route.
- [ ] Ground recruiter answers only on approved public content.
- [ ] Persist recruiter chat sessions and messages.
- [ ] Track recruiter visits, sessions started, messages sent, and session length.
- [ ] Give the candidate a copyable public link in the dashboard.
- [ ] Add slug regeneration support if needed.
- [ ] Add basic abuse controls: rate limiting, incomplete-profile fallback, and safe error states.

### 7. Minimal candidate dashboard

- [ ] Remove placeholder-only dashboard modules that do not support MVP outcomes.
- [ ] Show subscription status.
- [ ] Show the public recruiter link.
- [ ] Show public traffic metrics.
- [ ] Show recruiter chat activity metrics.
- [ ] Show profile completeness.
- [ ] Add a strong "continue training your AI" action back to `/chat`.

### 8. Launch readiness

- [ ] Tighten CORS and origin validation for production.
- [ ] Add health and readiness checks for deployment.
- [ ] Validate all required environment variables at startup.
- [ ] Ensure the chosen backend host supports persistent websockets.
- [ ] Add secure secret management for auth, Stripe, AI, and database settings.
- [ ] Run the full signup -> subscribe -> train AI -> public recruiter chat -> dashboard metrics smoke test.
- [ ] Update repo docs once the app scope changes from scaffold to MVP.

## Start Here

These are the first implementation tasks to do now, in order.

1. [ ] Add backend config validation plus Prisma and create the initial schema.
2. [ ] Add the `/pricing` route and page in the frontend.
3. [ ] Integrate managed auth in the frontend and protect `/dashboard` and `/chat`.
4. [ ] Add Stripe Checkout session creation, success/cancel routes, and webhook handling.
5. [ ] Split the current chat concept into private candidate chat and public recruiter chat.

## Definition Of Done

- [ ] A candidate can sign up, subscribe, and reach the dashboard.
- [ ] A candidate can train their AI in private chat until at least one approved STAR story exists.
- [ ] A recruiter can open the public link and chat with the candidate's AI anonymously.
- [ ] The dashboard shows live billing status, public traffic, recruiter chat activity, and profile completeness.
- [ ] The deployed app passes a full manual smoke test with Stripe test mode and websocket chat.