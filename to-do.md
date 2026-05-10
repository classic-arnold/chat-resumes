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
- [x] `/pricing` pricing page with real subscribe CTA
- [x] `/signup` managed auth signup flow
- [x] `/login` managed auth login flow
- [x] `/dashboard` candidate dashboard with live data
- [x] `/chat` private candidate AI authoring chat
- [x] `/p/:slug` public recruiter AI chat route
- [x] `/billing/success` Stripe success callback
- [x] `/billing/cancel` Stripe cancel callback

## Not In MVP

- [x] Recruiter accounts
- [x] Internal admin or webmaster dashboard
- [x] Live recruiter-to-candidate messaging
- [x] Multiple pricing tiers
- [x] Resume parsing pipeline
- [x] Separate editing surface outside the candidate chat flow

## Build Order

### 1. Lock the app contract

- [x] Freeze access rules for every route. See [docs/mvp-contract.md](docs/mvp-contract.md).
- [x] Freeze the public/private data boundary. See [docs/mvp-contract.md](docs/mvp-contract.md).
- [x] Freeze the core entities: user, profile, public slug, subscription, candidate chat session, candidate chat message, approved story, recruiter visit, recruiter chat session, recruiter chat message. See [docs/mvp-contract.md](docs/mvp-contract.md).
- [x] Write down the API surfaces before wiring UI: auth session check, billing status, checkout session creation, public profile fetch, candidate chat, recruiter chat, dashboard metrics. See [docs/mvp-contract.md](docs/mvp-contract.md).

### 2. Backend foundation

- [x] Add Postgres to the architecture.
- [x] Add Prisma to the backend workspace.
- [x] Create the first Prisma schema and migration set.
- [x] Add environment validation for database, auth, Stripe, AI, websocket, and app URLs.
- [x] Refactor the Express app so API routes, Stripe webhooks, and Socket.IO can be mounted cleanly.
- [x] Add a shared error-handling pattern for API routes.
- [x] Add request logging for API and websocket activity.

### 3. Authentication

- [x] Integrate the chosen managed auth provider in the web app.
- [x] Replace the placeholder signup page with a real signup flow.
- [x] Replace the placeholder login page with a real login flow.
- [x] Add protected-route handling for `/dashboard` and `/chat`.
- [x] Verify auth tokens or sessions in Express.
- [x] Create or sync the local user record after first signup.

### 4. Pricing and Stripe billing

- [x] Create a real pricing page in the web app.
- [x] Show one clear paid plan with a single subscribe CTA.
- [x] Add backend endpoint to create a Stripe Checkout session.
- [x] Create Stripe customer records tied to local users.
- [x] Add Stripe webhook handling with idempotency.
- [x] Persist subscription state locally.
- [x] Add billing success and cancel routes in the frontend.
- [x] Add a billing status card and billing portal link in the dashboard.

### 5. Candidate AI authoring chat

- [x] Rework `/chat` from demo mode into the private candidate chat.
- [x] Add Socket.IO to the Express server.
- [x] Add websocket connection handling in the web app.
- [x] Persist candidate chat sessions and messages.
- [x] Add AI orchestration that pushes for strong STAR stories.
- [x] Extract and store structured story fields: situation, task, action, result.
- [x] Mark stories as draft or approved for public use.
- [x] Show a minimal "what your AI knows so far" summary in chat or dashboard.

### 6. Public recruiter AI route

- [x] Create `/p/:slug` as a separate public route.
- [x] Load the candidate's approved public profile by slug.
- [x] Add recruiter-side websocket chat for the public route.
- [x] Ground recruiter answers only on approved public content.
- [x] Persist recruiter chat sessions and messages.
- [x] Track recruiter visits, sessions started, messages sent, and session length.
- [x] Give the candidate a copyable public link in the dashboard.
- [ ] Add slug regeneration support if needed.
- [x] Add basic abuse controls: rate limiting, incomplete-profile fallback, and safe error states.

### 7. Minimal candidate dashboard

- [x] Remove placeholder-only dashboard modules that do not support MVP outcomes.
- [x] Show subscription status.
- [x] Show the public recruiter link.
- [x] Show public traffic metrics.
- [x] Show recruiter chat activity metrics.
- [x] Show profile completeness.
- [x] Add a strong "continue training your AI" action back to `/chat`.

### 8. Launch readiness

- [ ] Tighten CORS and origin validation for production.
- [ ] Add health and readiness checks for deployment.
- [ ] Validate all required environment variables at startup.
- [ ] Ensure the chosen backend host supports persistent websockets.
- [ ] Add secure secret management for auth, Stripe, AI, and database settings.
- [ ] Remove the temporary free-account bypass and restore subscription checks for dashboard, chat, and candidate realtime access.
- [ ] Run the full signup -> subscribe -> train AI -> public recruiter chat -> dashboard metrics smoke test.
- [x] Update repo docs once the app scope changes from scaffold to MVP.

## Start Here

These are the first implementation tasks to do now, in order.

1. [x] Add backend config validation plus Prisma and create the initial schema.
2. [x] Add the `/pricing` route and page in the frontend.
3. [x] Integrate managed auth in the frontend and protect `/dashboard` and `/chat`.
4. [x] Add Stripe Checkout session creation, success/cancel routes, and webhook handling.
5. [x] Split the current chat concept into private candidate chat and public recruiter chat.

## Definition Of Done

- [ ] A candidate can sign up, subscribe, and reach the dashboard.
- [ ] A candidate can train their AI in private chat until at least one approved STAR story exists.
- [ ] A recruiter can open the public link and chat with the candidate's AI anonymously.
- [ ] The dashboard shows live billing status, public traffic, recruiter chat activity, and profile completeness.
- [ ] The deployed app passes a full manual smoke test with Stripe test mode and websocket chat.