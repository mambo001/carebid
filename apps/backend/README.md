# CareBid Backend

The backend provides the authenticated HTTP API for CareBid request creation, bidding, room reads, and live room notifications.

## Responsibilities

- Verify Firebase Auth ID tokens for every protected route.
- Use the Firebase Auth Emulator in local development and Firebase Admin credentials in production.
- Persist patients, providers, requests, and bids through Prisma and Postgres.
- Expose request lifecycle commands as HTTP routes.
- Publish room updates for open request rooms.
- Return CORS headers for browser-visible successes and failures.

## Authentication

Local development uses `FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9099`.

When an authenticated Firebase user is first seen, the backend bootstraps matching Patient and Provider rows with the Firebase UID as the profile id. This keeps local request and bid flows runnable while dedicated onboarding routes are not present.

The default bootstrapped provider receives the `imaging` category and demo verification metadata.

## API Surface

Session routes:

- `GET /api/session`: returns `{ ok: true, session }`.
- `POST /api/session/role`: accepts `{ role?: "patient" | "provider" }` and returns `{ ok: true, session }`.

Request routes:

- `GET /api/requests`: returns `{ items }` for the authenticated patient.
- `GET /api/requests/open`: returns `{ items }` for provider discovery.
- `POST /api/requests`: accepts `{ title, description, category }` and returns `{ request }`.
- `POST /api/requests/:id/open`: opens a draft request and returns `{ request }`.
- `GET /api/requests/:id/room`: returns `{ request }`.

Bid routes:

- `POST /api/requests/:id/bids`: accepts `{ requestId, amount, availableDate, notes }` and returns `{ bid }`.
- `POST /api/requests/:id/accept`: accepts `{ bidId }` and returns `{ request }`.

Stream route:

- `GET /api/requests/:id/stream`: opens a server-sent events stream for room updates.

## Request Shapes

Care requests are returned as discriminated domain variants:

- `DraftRequest`: request details before bidding opens.
- `OpenRequest`: request details plus `bids` after bidding opens.
- `AwardedRequest`: request details plus `bids`, `awardedBidId`, and `awardedAt`.

## Not Provided

- Patient onboarding route.
- Provider onboarding route.
- Bid withdrawal route.
- Request expiry route.

Consumers must not call unsupported routes.
