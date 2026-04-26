# CareBid Web

The web app is the React frontend for CareBid. It signs users in with Firebase Auth, calls the backend API with the current ID token, and renders patient and provider demo workspaces.

## Responsibilities

- Connect to the Firebase Auth Emulator in local development.
- Attach Firebase ID tokens to backend API calls.
- Decode backend responses at `src/lib/api.ts` with local Effect schemas.
- Treat the backend session as signed-in identity, not as a persistent UI role toggle.
- Let one signed-in demo user move between patient and provider workspaces.
- Render request variants returned by the backend: `DraftRequest`, `OpenRequest`, and `AwardedRequest`.
- Keep request list and room queries fresh after create, open, bid, and accept actions.

## API Boundary

`src/lib/api.ts` is the browser API boundary. It mirrors the backend routes and response shapes directly.

The web app currently calls:

- `GET /api/session`
- `GET /api/requests`
- `GET /api/requests/open`
- `POST /api/requests`
- `POST /api/requests/:id/open`
- `GET /api/requests/:id/room`
- `POST /api/requests/:id/bids`
- `POST /api/requests/:id/accept`

Request creation submits `{ title, description, category }`. The form only collects those currently supported backend fields.

## Workspaces

Patient and provider are demo workspaces, not separate frontend account states.

- `/patient` renders the request creation and patient request list workspace.
- `/provider` renders the provider discovery workspace.
- Request rooms include a demo-only workspace switch so the same signed-in user can exercise patient and provider room actions.
- Switching workspaces does not call `POST /api/session/role` and does not mutate backend session state.

## Room Updates

Request rooms read `{ request }` from `GET /api/requests/:id/room` and update that same query shape from server-sent event messages.

Room leaderboards are derived from `request.bids` for `OpenRequest` and `AwardedRequest` responses.

## Not Provided

The current backend does not provide onboarding, bid withdrawal, or request expiry endpoints. The web app does not render onboarding, withdrawal, or expiry controls in active request flows.
