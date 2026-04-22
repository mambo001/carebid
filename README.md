# CareBid

Reverse-bid healthcare marketplace built with Express, Firebase Auth, Neon Postgres, Redis, Prisma, and React.

## Local infrastructure

Start local Postgres, Redis, and the Firebase Auth emulator:

```bash
docker compose up -d
```

Services:

- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- Firebase Emulator UI: `http://127.0.0.1:4000`
- Firebase Auth Emulator: `127.0.0.1:9099`

## Local env setup

Backend example env lives at `apps/backend/.env.example`.

Web example env lives at `apps/web/.env.example`.

Root `.env.example` contains the local infra defaults used by Prisma.

After starting Docker, generate Prisma client and push the schema:

```bash
bun run db:generate
bun run db:push
```
