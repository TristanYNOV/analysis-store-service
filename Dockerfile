FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
# Required at runtime so the same image can execute Drizzle migrations
# (e.g. one-shot migration service in infra) via `npm run db:migrate`.
COPY drizzle.config.ts ./drizzle.config.ts
COPY drizzle ./drizzle
EXPOSE 3001
CMD ["node", "dist/main"]
