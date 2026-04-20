import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { openRequest } from "./open-request"

const layer = InMemoryRequestRepositoryLayer

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

const testIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

describe("openRequest command", () => {
  it("transitions a request to open", async () => {
    const result = await run(
      Effect.gen(function* () {
        const repo = yield* RequestRepository
        const created = yield* repo.createRequest(testIdentity, {
          category: "imaging",
          title: "Open command test",
          sanitizedSummary: "Testing the open request command pipeline",
          targetBudget: 200000,
          locationCity: "Taguig",
          locationRegion: "Metro Manila",
          preferredStartDate: "2026-05-01",
          preferredEndDate: "2026-05-05",
          urgency: "soon",
          serviceMode: "in_person",
          details: { imagingType: "mri", bodyArea: "head" },
          expiresAt: "2026-05-02T00:00:00.000Z",
        })
        return yield* openRequest(created.id)
      }),
    )
    expect(result.status).toBe("open")
  })

  it("fails for nonexistent request", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(openRequest("nonexistent"), layer),
    )
    expect(exit._tag).toBe("Failure")
  })
})
