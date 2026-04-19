import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { listRequests } from "./list-requests"

const layer = InMemoryRequestRepositoryLayer

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("listRequests query", () => {
  it("returns seed requests", async () => {
    const items = await run(listRequests())
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items.some((r) => r.id === "req-neuro-001")).toBe(true)
  })

  it("includes newly created requests", async () => {
    const items = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        yield* repo.createRequest({
          category: "imaging",
          title: "Query test",
          sanitizedSummary: "Testing list query after creation",
          targetBudgetCents: 100000,
          locationCity: "Makati",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-05",
          urgency: "routine",
          serviceMode: "either",
          details: { imagingType: "xray", bodyArea: "chest" },
          expiresAt: "2026-05-02T00:00:00.000Z",
        })
        return yield* listRequests()
      }),
    )
    expect(items.length).toBeGreaterThanOrEqual(3)
  })
})
