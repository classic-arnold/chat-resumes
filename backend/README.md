# Backend Workspace

Minimal Express + TypeScript backend for ChatResumes.

## Current scope

- Security baseline with `helmet` and `cors`
- Environment loading and validation with `dotenv` + `zod`
- Prisma schema and generated client for the MVP data model
- Express app composition prepared for `/api/*`, Stripe webhook routes, and a future Socket.IO gateway
- Shared API error handling and request logging
- Clerk-aware `/api` middleware and authenticated session bootstrap endpoint
- Stripe checkout, billing status, portal-session, and webhook state sync scaffolding
- Single status endpoint at `GET /health`

## API routes available now

- `GET /health`
- `GET /api`
- `GET /api/auth/session`
- `GET /api/billing/status`
- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `POST /api/stripe/webhooks`

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
- `OPENAI_API_KEY` is modeled now and will be required once the AI integrations are wired