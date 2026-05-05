# Backend Workspace

Minimal Express + TypeScript backend for ChatResumes.

## Current scope

- Security baseline with `helmet` and `cors`
- Environment loading with `dotenv`
- Single status endpoint at `GET /health`

## Commands

- `yarn dev`: start the backend in watch mode
- `yarn build`: compile TypeScript to `dist/`
- `yarn lint`: run a no-emit TypeScript check

## Local environment

Copy `.env.example` to `.env` if you need to override the default port or client origin.