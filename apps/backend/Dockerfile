FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy only package files first (better layer caching)
COPY package*.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install with npm ci (faster, uses package-lock.json) and skip optional deps
RUN npm ci --legacy-peer-deps --omit=optional 2>&1 || npm install --legacy-peer-deps --omit=optional

COPY . .

WORKDIR /app/apps/backend
RUN rm -rf node_modules && ln -s /app/node_modules node_modules
RUN npx prisma generate --schema prisma/schema.prisma

EXPOSE 8080

CMD ["npx", "tsx", "src/main.ts"]
