# ---- base ----
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY services/voice/package.json ./services/voice/
RUN pnpm install --frozen-lockfile

# ---- build db package ----
FROM deps AS build
COPY packages/db ./packages/db
RUN pnpm --filter @illvenn/db build

# ---- build voice service ----
COPY services/voice ./services/voice
RUN pnpm --filter @illvenn/voice build

# ---- runner ----
FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY services/voice/package.json ./services/voice/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/services/voice/dist ./services/voice/dist

WORKDIR /app/services/voice

ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "dist/server.js"]
