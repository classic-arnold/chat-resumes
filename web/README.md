# Web Workspace

Vite + React + TypeScript frontend for ChatResumes.

## Current routes

- `/`: fully implemented marketing landing page
- `/pricing`: implemented launch pricing page
- `/billing/success`: protected Stripe success callback route
- `/billing/cancel`: protected Stripe cancel callback route
- `/chat`: protected private candidate authoring chat with live Socket.IO updates
- `/p/:slug`: public recruiter AI route backed by approved public content
- `/signup`: implemented Clerk signup route
- `/login`: implemented Clerk login route
- `/dashboard`: protected live dashboard with billing, public-link, activity, and completeness data

## Stack in use

- React 19
- React Router
- Tailwind CSS via Vite plugin
- Global CSS theme layer for exact landing-page fidelity

## Commands

- `yarn dev`: start the Vite dev server
- `yarn build`: type-check and build production assets
- `yarn lint`: run ESLint

## Local environment

Copy `.env.example` to `.env` and set `VITE_CLERK_PUBLISHABLE_KEY` before using the live auth routes.
Set `VITE_API_BASE_URL` if the frontend should call a backend origin other than the local default.
Set `VITE_SOCKET_PATH` only if the backend Socket.IO path differs from `/socket.io`.
Set `VITE_POSTHOG_PROJECT_TOKEN` and optionally `VITE_POSTHOG_HOST` to enable frontend PostHog analytics.
