# CareBid Web

The web app is the React frontend for CareBid. It signs users in with Firebase Auth, calls the backend API with the current ID token, and renders patient and provider request workflows.

## Responsibilities

- Connect to the Firebase Auth Emulator in local development.
- Attach Firebase ID tokens to backend API calls.
- Decode backend responses at `src/lib/api.ts` with local Effect schemas.
- Render request variants returned by the backend: `DraftRequest`, `OpenRequest`, and `AwardedRequest`.
- Keep request list and room queries fresh after create, open, bid, and accept actions.

## API Boundary

`src/lib/api.ts` is the browser API boundary. It mirrors the backend routes and response shapes directly.

The web app currently calls:

- `GET /api/session`
- `POST /api/session/role`
- `GET /api/requests`
- `GET /api/requests/open`
- `POST /api/requests`
- `POST /api/requests/:id/open`
- `GET /api/requests/:id/room`
- `POST /api/requests/:id/bids`
- `POST /api/requests/:id/accept`

Request creation submits `{ title, description, category }`. The existing form still collects additional fields for the product flow, but only fields supported by the backend are sent.

## Room Updates

Request rooms read `{ request }` from `GET /api/requests/:id/room` and update that same query shape from server-sent event messages.

Room leaderboards are derived from `request.bids` for `OpenRequest` and `AwardedRequest` responses.

## Not Provided

The current backend does not provide onboarding, bid withdrawal, or request expiry endpoints. The web app leaves onboarding controls disabled through unsupported mutations and does not render withdrawal or expiry controls in active request flows.
