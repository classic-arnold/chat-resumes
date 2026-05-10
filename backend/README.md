# Backend Workspace

Minimal Express + TypeScript backend for ChatResumes.

## Current scope

- Security baseline with `helmet` and `cors`
- Environment loading and validation with `dotenv` + `zod`
- Prisma schema and generated client for the MVP data model
- Express app composition for `/api/*`, Stripe webhook routes, and live Socket.IO namespaces
- Shared API error handling and request logging
- Clerk-aware `/api` middleware and authenticated session bootstrap endpoint
- Stripe checkout, billing status, portal-session, and webhook state sync scaffolding
- Candidate dashboard, profile, and chat bootstrap routes backed by Prisma
- Public recruiter profile route plus persisted candidate/recruiter chat state
- Single status endpoint at `GET /health`

## API routes available now

- `GET /health`
- `GET /api`
- `GET /api/auth/session`
- `GET /api/billing/status`
- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `GET /api/dashboard`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/chat/candidate/session`
- `POST /api/chat/candidate/stories/:storyId/approve`
- `GET /api/public/profiles/:slug`
- `POST /api/stripe/webhooks`

## Realtime namespaces

- `/candidate`: authenticated private authoring chat for subscribed candidates
- `/recruiter`: public recruiter chat grounded on approved public content

## Commands

- `yarn dev`: start the backend in watch mode
- `yarn build`: compile TypeScript to `dist/`
- `yarn lint`: run a no-emit TypeScript check
- `yarn prisma:generate`: generate the Prisma client
- `yarn prisma:migrate:dev`: create and apply a local development migration
- `yarn prisma:migrate:deploy`: apply committed migrations

## Local environment

Copy `.env.example` to `.env` and set at least the database connection before running Prisma commands.

- `DATABASE_URL` points Prisma at the PostgreSQL database for the MVP
- `CLERK_SECRET_KEY` is required to verify backend auth and bootstrap local users from Clerk
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` are required for the Stripe billing flow
- `OPENAI_API_KEY` enables live OpenAI-backed replies for the private candidate chat and public recruiter chat