FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/website/package.json ./apps/website/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/types/package.json ./packages/types/package.json

RUN npm ci --workspaces --include-workspace-root

FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY packages ./packages

WORKDIR /app/apps/web
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S kyvora && adduser -S -G kyvora kyvora

COPY --from=build --chown=kyvora:kyvora /app/apps/web/.next/standalone ./
COPY --from=build --chown=kyvora:kyvora /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=kyvora:kyvora /app/apps/web/public ./apps/web/public

EXPOSE 3000

USER kyvora

CMD ["node", "apps/web/server.js"]
