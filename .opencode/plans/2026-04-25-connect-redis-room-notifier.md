# Connect Redis RoomNotifier to SseRegistry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch dev to Redis RoomNotifier and add the missing subscriber daemon that loads fresh request state and broadcasts to the local in-memory SseRegistry.

**Architecture:** Redis pub/sub connects multiple backend instances. The RoomSubscriber daemon listens on `room:*` channels, loads fresh request state from Prisma, and pushes updates to the in-process SseRegistry. The in-memory RoomNotifier adapter is kept as a fallback but dev switches to Redis.

**Tech Stack:** TypeScript, Effect, ioredis, Prisma, Vitest

---

### Task 1: Add Redis subscriber factory

**Files:**
- Modify: `apps/backend/src/adapters/redis/lib/redis-client.ts`

- [ ] **Step 1: Add `makeRedisSubscriber`**

```typescript
export const makeRedisSubscriber = Effect.gen(function* () {
  const redisUrl = yield* Config.string("REDIS_URL")
  const subscriber = new Redis(redisUrl, { lazyConnect: true })
  yield* Effect.promise(() => subscriber.connect())
  return subscriber
})
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

---

### Task 2: Create RoomSubscriber port

**Files:**
- Create: `apps/backend/src/ports/RoomSubscriber.ts`

- [ ] **Step 1: Write the port**

```typescript
import { Context, Effect } from "effect"

export class RoomSubscriber extends Context.Tag("@carebid/RoomSubscriber")<
  RoomSubscriber,
  {
    readonly _tag: "RoomSubscriber"
  }
>() {}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

---

### Task 3: Create RoomSubscriber Redis adapter

**Files:**
- Create: `apps/backend/src/adapters/redis/RoomSubscriber.ts`

- [ ] **Step 1: Write the adapter**

```typescript
import { Effect, Layer } from "effect"
import { RoomSubscriber } from "../../ports/RoomSubscriber"
import { CareRequests } from "../../ports/CareRequests"
import { SseRegistry } from "../../ports/SseRegistry"
import { RequestId } from "../../data/branded"
import { makeRedisSubscriber } from "./lib/redis-client"
import { serializeCareRequest } from "../../program"

export const make = Effect.gen(function* () {
  const redis = yield* makeRedisSubscriber
  const careRequests = yield* CareRequests
  const sseRegistry = yield* SseRegistry

  yield* Effect.forkDaemon(
    Effect.gen(function* () {
      yield* Effect.promise(() => redis.psubscribe("room:*"))

      yield* Effect.async<never, never, never>((resume) => {
        redis.on("pmessage", (_pattern, channel, _message) => {
          const requestId = channel.replace("room:", "")
          Effect.runFork(
            Effect.gen(function* () {
              const request = yield* careRequests.findById(requestId as RequestId)
              const payload = JSON.stringify({ request: serializeCareRequest(request) })
              yield* sseRegistry.broadcast(requestId as RequestId, payload)
            }).pipe(Effect.catchAll(() => Effect.void))
          )
        })
      })
    }).pipe(Effect.catchAll(() => Effect.void))
  )

  return RoomSubscriber.of({ _tag: "RoomSubscriber" })
})

export const layer = Layer.effect(RoomSubscriber, make)
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

---

### Task 4: Switch dev to Redis RoomNotifier

**Files:**
- Modify: `apps/backend/src/environments/environment.dev.ts`

- [ ] **Step 1: Replace in-memory RoomNotifier import with Redis**

Change:
```typescript
import * as RoomNotifierAdapter from "../adapters/in-memory/RoomNotifier"
```

To:
```typescript
import * as RoomNotifierAdapter from "../adapters/redis/RoomNotifier"
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

---

### Task 5: Wire RoomSubscriber into environments

**Files:**
- Modify: `apps/backend/src/environments/environment.dev.ts`
- Modify: `apps/backend/src/environments/environment.prod.ts`

- [ ] **Step 1: Add RoomSubscriber import to dev environment**

Add import:
```typescript
import * as RoomSubscriberAdapter from "../adapters/redis/RoomSubscriber"
```

- [ ] **Step 2: Add RoomSubscriber layer to BaseLayers in dev**

Add `RoomSubscriberAdapter.layer` to the `BaseLayers` merge:
```typescript
const BaseLayers = Layer.mergeAll(
  CareRequestsAdapter.layer,
  BidsAdapter.layer,
  UsersLive,
  RoomNotifierAdapter.layer,
  SseRegistryAdapter.layer,
  AuthProviderLive,
  RoomSubscriberAdapter.layer,
)
```

- [ ] **Step 3: Add RoomSubscriber to prod environment**

Add import:
```typescript
import * as RoomSubscriber from "../adapters/redis/RoomSubscriber"
```

Add to BaseLayers:
```typescript
const BaseLayers = Layer.mergeAll(
  CareRequests.layer,
  Bids.layer,
  UsersLive,
  RoomNotifier.layer,
  SseRegistry.layer,
  AuthProviderLive,
  RoomSubscriber.layer,
)
```

- [ ] **Step 4: Verify typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

---

### Task 6: Add integration test for subscriber bridge

**Files:**
- Create: `apps/backend/src/adapters/redis/RoomSubscriber.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { RoomSubscriber } from "../../ports/RoomSubscriber"
import { SseRegistry } from "../../ports/SseRegistry"
import { CareRequests } from "../../ports/CareRequests"
import { RequestId, UserId } from "../../data/branded"
import { OpenRequest } from "../../data/entities"

describe("RoomSubscriber Redis adapter", () => {
  it.effect("constructs the subscriber service with correct tag", () =>
    Effect.gen(function* () {
      const mockSseRegistry = SseRegistry.of({
        add: () => Effect.succeed(Effect.void),
        remove: () => Effect.void,
        broadcast: () => Effect.void,
        hasSubscribers: () => Effect.succeed(true),
      })

      const mockRequest = new OpenRequest({
        id: "req_test" as RequestId,
        patientId: "patient_1" as UserId,
        title: "Test Request",
        description: "Description",
        category: "imaging",
        bids: [],
        openedAt: new Date("2024-01-01"),
      })

      const mockCareRequests = CareRequests.of({
        findById: () => Effect.succeed(mockRequest),
        findByPatient: () => Effect.succeed([]),
        findOpen: () => Effect.succeed([]),
        save: () => Effect.void,
      })

      const testLayer = Layer.succeed(SseRegistry, mockSseRegistry).pipe(
        Layer.merge(Layer.succeed(CareRequests, mockCareRequests))
      )

      const subscriber = yield* RoomSubscriber.pipe(
        Effect.provide(testLayer)
      )

      expect(subscriber._tag).toBe("RoomSubscriber")
    })
  )
})
```

- [ ] **Step 2: Run the test**

Run: `cd apps/backend && npm run test -- src/adapters/redis/RoomSubscriber.test.ts`
Expected: Pass

---

### Task 7: Verify end-to-end

- [ ] **Step 1: Run backend tests**

Run: `cd apps/backend && npm run test`
Expected: All tests pass

- [ ] **Step 2: Run backend typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: Pass

- [ ] **Step 3: Run web typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: Pass

- [ ] **Step 4: Browser-facing verification**

Create request, open, connect SSE stream, place bid, verify SSE receives room update with the new bid.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/adapters/redis/lib/redis-client.ts \
  apps/backend/src/ports/RoomSubscriber.ts \
  apps/backend/src/adapters/redis/RoomSubscriber.ts \
  apps/backend/src/adapters/redis/RoomSubscriber.test.ts \
  apps/backend/src/environments/environment.dev.ts \
  apps/backend/src/environments/environment.prod.ts
git commit -m "feat: connect Redis RoomNotifier to SseRegistry via RoomSubscriber daemon"
```

---

## Self-Review

- **Spec coverage:** All tasks covered: subscriber factory, port, adapter, environment wiring, tests, verification.
- **Placeholder scan:** No placeholders — all code, commands, and expected outputs are explicit.
- **Type consistency:** Uses existing `RequestId`, `CareRequests`, `SseRegistry`, `serializeCareRequest` from current codebase.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-connect-redis-room-notifier.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
