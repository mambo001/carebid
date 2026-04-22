FROM oven/bun:1.2.21 AS builder

WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bun install --frozen-lockfile

WORKDIR /app/apps/web
RUN bun run build

FROM oven/bun:1.2.21 AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["bunx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
