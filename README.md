# CareBid

Reverse-bid healthcare marketplace built with Effect, Firebase Auth, Neon Postgres, Redis, Prisma, and React.

## Projects

- `apps/backend`: Effect HTTP API for sessions, care requests, bidding, and room streams.
- `apps/web`: React frontend that consumes the backend API directly through a typed local API boundary.

## Current API Contract

The backend is the source of truth for browser-facing contracts. The web app decodes current backend response shapes in `apps/web/src/lib/api.ts` instead of relying on stale shared response contracts.

Stable local routes:

- `GET /api/session`: returns `{ ok, session }` for an authenticated Firebase user.
- `POST /api/session/role`: switches the active role in the returned session payload.
- `GET /api/requests`: lists requests owned by the authenticated patient.
- `GET /api/requests/open`: lists open requests for providers.
- `POST /api/requests`: creates a draft request from `{ title, description, category }`.
- `POST /api/requests/:id/open`: opens a draft request for bidding.
- `GET /api/requests/:id/room`: returns `{ request }` for the room view.
- `POST /api/requests/:id/bids`: places a provider bid.
- `POST /api/requests/:id/accept`: accepts a bid and awards the request.

Request responses use domain variants with `_tag` discriminators: `DraftRequest`, `OpenRequest`, and `AwardedRequest`.

The backend currently does not expose onboarding, bid withdrawal, or request expiry routes. The web app does not call those endpoints.

## Local infrastructure

Start local Postgres, Redis, and the Firebase Auth emulator:

```bash
npm run docker:dev
```

Services:

- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- Firebase Emulator UI: `http://127.0.0.1:4000`
- Firebase Auth Emulator: `127.0.0.1:9099`
- Backend API: `http://127.0.0.1:8080`
- Web app: `http://127.0.0.1:5173`

## Local env setup

Backend example env lives at `apps/backend/.env.example`.

Web example env lives at `apps/web/.env.example`.

Root `.env.example` contains the local infra defaults used by Prisma.

When running the full stack via `docker compose`, the backend container now syncs the Prisma schema on startup.

If you are running Prisma commands from the host instead, generate Prisma client and push the schema manually:

```bash
bun run db:generate
bun run db:push
```
