FROM oven/bun:1.2.21

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json

RUN bun install --frozen-lockfile

COPY . .

WORKDIR /app/apps/backend
RUN rm -rf node_modules && ln -s /app/node_modules node_modules
RUN bunx prisma generate --schema prisma/schema.prisma

EXPOSE 8080

CMD ["bun", "src/index.ts"]
