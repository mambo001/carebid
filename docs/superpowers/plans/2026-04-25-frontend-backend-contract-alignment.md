# Frontend Backend Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the web frontend to consume the current backend API routes and response shapes.

**Architecture:** Keep the backend as the source of truth. Add web-local API types and mapping functions in `apps/web/src/lib/api.ts`, then update affected pages to render those types instead of stale shared contract shapes.

**Tech Stack:** TypeScript, React, TanStack Query, Effect Schema, Vite, Firebase Auth Emulator.

---

### Task 1: Align API Boundary

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/queries.ts`

- [ ] Replace stale shared response decoders with local schemas for current backend responses: session, request list, create/open request, room request, place bid, accept bid.
- [ ] Route `acceptBid` to `POST /api/requests/:id/accept`.
- [ ] Remove or disable frontend calls to unsupported backend endpoints: onboarding, withdraw bid, expire request.
- [ ] Keep query invalidation for requests and room details.

### Task 2: Update Request List Pages

**Files:**
- Modify: `apps/web/src/app/pages/patient/patient-dashboard.tsx`
- Modify: `apps/web/src/app/pages/provider/provider-dashboard.tsx`
- Modify: `apps/web/src/app/pages/patient/request-form-card.tsx`

- [ ] Render current backend request variants: `DraftRequest`, `OpenRequest`, and `AwardedRequest`.
- [ ] Submit create request using backend body `{ title, description, category }` derived from the current form.
- [ ] Display only fields available from backend responses.

### Task 3: Update Request Room

**Files:**
- Modify: `apps/web/src/app/pages/requests/request-room.tsx`
- Modify: `apps/web/src/app/pages/requests/provider-bid-card.tsx`
- Modify: `apps/web/src/lib/use-room-socket.ts` if stale snapshot decoding breaks.

- [ ] Render `GET /api/requests/:id/room` response `{ request }`.
- [ ] Show bids from `request.bids` for open/awarded requests.
- [ ] Place bids with current backend bid body and accept bids with current backend accept route.

### Task 4: Verify

**Files:**
- Run commands only.

- [ ] Run `npm run typecheck` in `apps/web`.
- [ ] Run browser-facing API checks against the running backend with a Firebase emulator token.
- [ ] Commit verified changes.

---

## Self-Review

- Spec coverage: frontend follows backend routes and shapes.
- Placeholder scan: no unresolved placeholders.
- Type consistency: request and bid types are defined at the API boundary and reused by pages.
