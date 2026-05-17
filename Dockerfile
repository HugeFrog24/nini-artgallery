# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM --platform=$BUILDPLATFORM node:22-alpine3.22 AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_DEFAULT_TO_LATEST=0

COPY package.json pnpm-lock.yaml ./

RUN corepack enable \
 && corepack prepare pnpm@11.1.2 --activate \
 && pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM --platform=$BUILDPLATFORM node:22-alpine3.22 AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_DEFAULT_TO_LATEST=0

RUN corepack enable \
 && corepack prepare pnpm@11.1.2 --activate

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN pnpm build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:22-alpine3.22 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]