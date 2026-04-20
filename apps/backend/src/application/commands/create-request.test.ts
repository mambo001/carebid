import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { createRequest } from "./create-request"
import type { AuthIdentity } from "../../domain/ports/session-repository"

const layer = InMemoryRequestRepositoryLayer
const testIdentity: AuthIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("createRequest command", () => {
  it("creates a request and it appears in the list", async () => {
    const result = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        const created = yield* createRequest(testIdentity, {
          category: "specialist_consult",
          title: "Command test request",
          sanitizedSummary: "Testing the create request command pipeline",
          targetBudget: 300000,
          locationCity: "Makati",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-10",
          urgency: "routine",
          serviceMode: "telehealth",
          details: { visitType: "new_issue", specialty: "Cardiology" },
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
