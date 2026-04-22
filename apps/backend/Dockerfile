FROM oven/bun:1.2.21

WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY . .

WORKDIR /app/apps/backend
RUN ln -s /app/node_modules /app/apps/backend/node_modules

EXPOSE 8080

CMD ["bun", "src/index.ts"]
