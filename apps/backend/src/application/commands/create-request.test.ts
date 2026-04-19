import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { createRequest } from "./create-request"

const layer = InMemoryRequestRepositoryLayer

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("createRequest command", () => {
  it("creates a request and it appears in the list", async () => {
    const result = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        const created = yield* createRequest({
          category: "specialist_consult",
          title: "Command test request",
          sanitizedSummary: "Testing the create request command pipeline",
          targetBudgetCents: 300000,
          locationCity: "Makati",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-10",
          urgency: "routine",
          serviceMode: "telehealth",
          details: { visitType: "initial_consult", specialty: "Cardiology" },
          expiresAt: "2026-05-02T00:00:00.000Z",
        })
        const list = yield* repo.listRequests()
        return { created, list }
      }),
    )
    expect(result.created.status).toBe("draft")
    expect(result.list.some((r) => r.id === result.created.id)).toBe(true)
  })
})
