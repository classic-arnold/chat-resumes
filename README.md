# ChatResumes

Validate-stage monorepo scaffold for ChatResumes.

## Surfaces

- `web/`: Vite + React + TypeScript frontend
- `backend/`: Express + TypeScript API
- `infra/aws/`: EC2 + ALB + CodePipeline CDK scaffold for backend deployment

## Current scope

- Exact-feel marketing landing page
- Dedicated pricing page with a Stripe-backed launch plan CTA
- Live Clerk-powered signup and login routes in the frontend
- Protected candidate dashboard with live billing, public-link, activity, and completeness data
- Protected private candidate authoring chat backed by persisted sessions and Socket.IO
- Public recruiter AI route grounded on approved public profile content and approved STAR stories
- Billing success/cancel routes and dashboard billing status in the frontend
- Backend routes for dashboard metrics, candidate profile, candidate chat bootstrap, and public profile loading
- Backend realtime namespaces for candidate and recruiter chats with persistence and basic rate limiting

## Out of scope for this setup

- Live database migrations against a provisioned Postgres instance
- Email
- Production-ready infrastructure rollout. The current backend deployment scaffold lives in `infra/aws/`, but uploads still need durable object storage before that path is production-safe.

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

`CLIENT_ORIGIN` accepts a comma-separated allowlist when the API needs to serve both a local preview and a deployed frontend, for example `http://localhost:43173,https://chatresumes.com`.

## Getting started

1. Run `yarn install` if you want to use the native local workflow
2. Copy `backend/.env.example` to `backend/.env` and `web/.env.example` to `web/.env` if you need non-Docker local overrides
3. Run `yarn dev` for the native workflow or `make dev` for the Docker workflow

## Route intent

- `/`: fully implemented landing page
- `/pricing`: implemented pricing page that starts Stripe checkout for signed-in users
- `/billing/success`: protected Stripe success callback route
- `/billing/cancel`: protected Stripe cancel callback route
- `/chat`: protected private candidate authoring chat with persisted sessions and approvals
- `/p/:slug`: public recruiter AI chat route for approved public profile content
- `/signup`: implemented Clerk signup route
- `/login`: implemented Clerk login route
- `/dashboard`: protected live candidate dashboard with billing, public-link, activity, and completeness data

## API intent

- `GET /health`: service health status
- `GET /api`: current API surface placeholder
- `GET /api/auth/session`: verify Clerk auth state and sync the local user record
- `GET /api/billing/status`: get the candidate billing summary
- `POST /api/billing/checkout-session`: create a Stripe Checkout session
- `POST /api/billing/portal-session`: create a Stripe Billing Portal session
- `GET /api/dashboard`: get the candidate dashboard summary
- `GET /api/profile`: get the candidate profile and completeness state
- `PATCH /api/profile`: update non-chat-derived candidate profile fields
- `GET /api/chat/candidate/session`: get the private candidate chat session bootstrap payload
- `POST /api/chat/candidate/stories/:storyId/approve`: approve a structured story for public use
- `GET /api/public/profiles/:slug`: load the recruiter-safe public profile payload
- `POST /api/stripe/webhooks`: receive and sync Stripe webhook events
