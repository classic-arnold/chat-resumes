# ChatResumes

Validate-stage monorepo scaffold for ChatResumes.

## Surfaces

- `web/`: Vite + React + TypeScript frontend
- `backend/`: Express + TypeScript API

## Current scope

- Exact-feel marketing landing page
- Designed recruiter chat demo page
- Placeholder route shells for signup, login, and dashboard
- Minimal backend health endpoint

## Out of scope for this setup

- Authentication flows
- Database and persistence
- Payments
- Email
- Infrastructure and deployment

## Workspace commands

- `yarn dev`: run frontend and backend together
- `yarn dev:web`: run frontend only
- `yarn dev:backend`: run backend only
- `yarn build`: build both workspaces
- `yarn lint`: lint both workspaces

## Getting started

1. Run `yarn install`
2. Copy `backend/.env.example` to `backend/.env` if you need local overrides
3. Run `yarn dev`

## Route intent

- `/`: fully implemented landing page
- `/chat`: fully implemented recruiter chat demo page
- `/signup`: close-match shell only
- `/login`: close-match shell only
- `/dashboard`: close-match shell only

## API intent

- `GET /health`: service health status# chat-resumes
