FROM node:22-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json yarn.lock ./
COPY backend/package.json backend/package.json
COPY backend/prisma backend/prisma
COPY web/package.json web/package.json

RUN yarn install --frozen-lockfile

FROM deps AS build

COPY backend backend

RUN yarn workspace chat-resumes-backend prisma:generate
RUN yarn workspace chat-resumes-backend build

FROM base AS backend

ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:${PATH}"

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 4000

CMD ["sh", "-c", "yarn prisma:migrate:deploy && node dist/server.js"]