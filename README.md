# CareBid

CareBid is a tightly scoped demo of a reverse-bid healthcare marketplace.

The product surface is intentionally small. The point of the project is the architecture: a full-stack app with real authentication, database persistence, pub/sub updates, cloud infrastructure, CI/CD, and deployment orchestration across GCP, Firebase, Neon, and Redis.

## Scope

In scope:

- architecture and integration demonstration
- cloud infrastructure orchestration with Terraform
- GitHub Actions deployment for backend and web apps
- Firebase-backed signup and login
- patient and provider demo workspaces
- request creation, opening, bidding, and award flows
- live room updates for active requests
- production deployment to GCP and Firebase Hosting

Not in scope:

- a complete healthcare marketplace product
- broad feature depth beyond the demo workflow
- patient onboarding routes
- provider onboarding routes
- bid withdrawal
- request expiry automation
- custom domain management

Most implementation choices optimize for showing a credible deployed architecture rather than maximizing application feature breadth.

## Architecture Summary

```text
React web app on Firebase Hosting
  |
  v
Cloud Run backend API
  |
  +--> Firebase Auth session verification
  +--> request and bid commands
  +--> room read/stream endpoints
  |
  +--> Neon Postgres
  |      - requests
  |      - bids
  |      - users
  |
  +--> Redis pub/sub
         - live room updates
```

The repo is split into two applications:

- `apps/backend`: Effect-based HTTP API and room update publisher
- `apps/web`: React frontend with a local API boundary and Firebase Auth client

Supporting infrastructure lives in `infra/terraform` and is deployed through GitHub Actions.

## Design Decisions

### Backend Owns the API Contract

The backend is the source of truth for browser-facing request/session shapes.

The web app decodes responses at `apps/web/src/lib/api.ts` instead of relying on stale shared response types.

Why this fits:

- keeps the browser boundary explicit
- avoids contract drift during backend changes
- keeps the frontend thin

### Demo Patient and Provider Workspaces

The frontend lets one signed-in demo user move between patient and provider views.

Why this fits:

- keeps the demo easy to exercise
- avoids maintaining separate demo accounts for every flow
- keeps the backend session as the source of identity

### Cloud Run + Firebase Hosting

The backend runs on Cloud Run and the frontend is served from Firebase Hosting.

Why this fits:

- simple production hosting model
- clear separation between static web assets and backend API
- easy auth integration with Firebase

### Redis for Room Fanout

Redis is only used as a pub/sub bridge for room updates.

Why this fits:

- lightweight live updates
- no need for persistence or caching complexity
- keeps request reads backed by Postgres

## Data Flow

### 1. Sign In

1. User signs in through Firebase Auth.
2. Web app fetches an ID token.
3. Web app sends the token to the backend with API requests.
4. Backend verifies the token and returns a session payload.

### 2. Request Lifecycle

1. Patient creates a draft request.
2. Patient opens the request for bidding.
3. Providers discover the open request and place bids.
4. Patient awards one bid.
5. Backend stores the resulting request state in Postgres.

### 3. Room Updates

1. Backend writes request changes to Postgres.
2. Backend publishes a room update event to Redis.
3. Room subscribers load fresh state from Postgres.
4. Web clients receive the updated room payload through SSE.

## Repository Layout

- `apps/backend`: HTTP API, adapters, and Prisma schema
- `apps/web`: React UI and browser API boundary
- `infra/terraform`: GCP, Firebase, Neon, and supporting infrastructure
- `.github/workflows`: push-to-master deployment workflows
- `infra/README.md`: infrastructure and deployment details
- `apps/backend/README.md`: backend responsibilities and API surface
- `apps/web/README.md`: frontend responsibilities and API boundary

## Deployment Model

Pushes to `master` trigger two GitHub Actions workflows:

- backend deploy: builds the Docker image, pushes to Artifact Registry, and deploys Cloud Run
- web deploy: builds the Vite bundle and deploys Firebase Hosting

Terraform provisions:

- Cloud Run backend service
- Firebase project, Auth config, and Hosting site
- Artifact Registry repository
- Secret Manager secrets for database and Redis connection strings
- Neon Postgres resources

## Local Run

```bash
bun install
npm run docker:dev
```

Local services:

- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- Firebase Auth Emulator: `127.0.0.1:9099`
- Firebase Emulator UI: `http://127.0.0.1:4000`
- Backend API: `http://127.0.0.1:8080`
- Web app: `http://127.0.0.1:5173`

## Local Environment Files

- Backend example env: `apps/backend/.env.example`
- Web example env: `apps/web/.env.example`
- Root example env: `.env.example`

## Current Limits

- no patient/provider onboarding routes
- no bid withdrawal endpoint
- no request expiry endpoint
- no advanced Redis usage beyond pub/sub
- no custom domain configuration for Firebase Hosting

## Next Technical Steps

1. Add onboarding flows for patient/provider profiles.
2. Add bid withdrawal and request expiry workflows.
3. Improve room update fanout if live traffic grows.
4. Add custom domain support for production hosting.

## Reference Docs

- `apps/backend/README.md`
- `apps/web/README.md`
- `infra/README.md`
