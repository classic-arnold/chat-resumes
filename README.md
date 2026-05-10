# ChatResumes

Validate-stage monorepo scaffold for ChatResumes.

## Surfaces

- `web/`: Vite + React + TypeScript frontend
- `backend/`: Express + TypeScript API

## Current scope

- Exact-feel marketing landing page
- Dedicated pricing page with a Stripe-backed launch plan CTA
- Live Clerk-powered signup and login routes in the frontend
- Protected dashboard and candidate chat routes in the frontend
- Billing success/cancel routes and dashboard billing status in the frontend
- Designed recruiter chat demo page
- Placeholder dashboard and chat product content behind real auth gating
- Backend foundation for env validation, Prisma, API composition, Clerk session bootstrap, and Stripe billing routes

## Out of scope for this setup

- Live database migrations against a provisioned Postgres instance
- Email
- Infrastructure and deployment

## Workspace commands

- `yarn dev`: run frontend and backend together
- `yarn dev:web`: run frontend only
- `yarn dev:backend`: run backend only
- `yarn build`: build both workspaces
- `yarn lint`: lint both workspaces

## Docker workflow

- `make start`: run Postgres plus built preview containers in the background
- `make dev`: run the live-reload Docker stack in the foreground
- `make stop`: stop the Docker stack and remove orphaned services

Docker host ports are intentionally off the usual defaults:

- Web preview: `http://localhost:43173`
- Web dev: `http://localhost:43174`
- API preview: `http://localhost:43807`
- API dev: `http://localhost:43808`
- Postgres: `localhost:45439`

If you want Clerk, Stripe, or OpenAI keys inside Docker, expose them from your shell or add them to a root `.env` file before running `make start` or `make dev`.

## Getting started

1. Run `yarn install` if you want to use the native local workflow
2. Copy `backend/.env.example` to `backend/.env` and `web/.env.example` to `web/.env` if you need non-Docker local overrides
3. Run `yarn dev` for the native workflow or `make dev` for the Docker workflow

## Route intent

- `/`: fully implemented landing page
- `/pricing`: implemented pricing page that starts Stripe checkout for signed-in users
- `/billing/success`: protected Stripe success callback route
- `/billing/cancel`: protected Stripe cancel callback route
- `/chat`: protected route; still using demo content until candidate chat is rebuilt
- `/signup`: implemented Clerk signup route
- `/login`: implemented Clerk login route
- `/dashboard`: protected route; still using dashboard shell content

## API intent

- `GET /health`: service health status
- `GET /api`: current API surface placeholder
- `GET /api/auth/session`: verify Clerk auth state and sync the local user record
- `GET /api/billing/status`: get the candidate billing summary
- `POST /api/billing/checkout-session`: create a Stripe Checkout session
- `POST /api/billing/portal-session`: create a Stripe Billing Portal session
- `POST /api/stripe/webhooks`: receive and sync Stripe webhook events
