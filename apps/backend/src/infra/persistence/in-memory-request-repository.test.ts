import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "./in-memory-request-repository"

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, InMemoryRequestRepositoryLayer))

const testIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

describe("InMemoryRequestRepository", () => {
  it("lists seed requests", async () => {
    const items = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        return yield* repo.listRequests()
      }),
    )
    expect(items.length).toBe(2)
    expect(items.map((r) => r.id)).toContain("req-neuro-001")
    expect(items.map((r) => r.id)).toContain("req-imaging-003")
  })

  it("gets a request by id", async () => {
    const item = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        return yield* repo.getRequest("req-neuro-001")
      }),
    )
    expect(item.id).toBe("req-neuro-001")
    expect(item.title).toBe("Neurology second opinion")
  })

  it("fails with RequestNotFoundError for unknown id", async () => {
    const result = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const repo = yield* RequestRepository
          return yield* repo.getRequest("nonexistent")
        }),
        InMemoryRequestRepositoryLayer,
      ),
    )
    expect(result._tag).toBe("Failure")
  })

  it("creates a request with draft status", async () => {
    const item = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        return yield* repo.createRequest(testIdentity, {
          category: "specialist_consult",
          title: "Test request",
          sanitizedSummary: "A test request for unit testing purposes",
          targetBudgetCents: 500000,
          locationCity: "Manila",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-10",
          urgency: "routine",
          serviceMode: "telehealth",
          details: { visitType: "initial_consult", specialty: "Dermatology" },
          expiresAt: "2026-05-02T00:00:00.000Z",
        })
      }),
    )
    expect(item.status).toBe("draft")
    expect(item.id).toMatch(/^req-/)
    expect(item.title).toBe("Test request")
  })

  it("opens a request", async () => {
    const item = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        const created = yield* repo.createRequest(testIdentity, {
          category: "imaging",
          title: "Open test",
          sanitizedSummary: "Testing open transition for request",
          targetBudgetCents: 100000,
          locationCity: "Quezon City",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-05",
          urgency: "soon",
          serviceMode: "in_person",
          details: { imagingType: "ct", bodyArea: "chest" },
          expiresAt: "2026-05-02T00:00:00.000Z",
        })
        return yield* repo.openRequest(created.id)
      }),
    )
    expect(item.status).toBe("open")
  })

  it("marks a request as awarded", async () => {
    const item = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        return yield* repo.markRequestAwarded("req-neuro-001", "bid-123")
      }),
    )
    expect(item.status).toBe("awarded")
  })

  it("marks a request as expired", async () => {
    const item = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        return yield* repo.markRequestExpired("req-imaging-003")
      }),
    )
    expect(item.status).toBe("expired")
  })
})
