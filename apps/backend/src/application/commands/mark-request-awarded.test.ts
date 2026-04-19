import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { markRequestAwarded } from "./mark-request-awarded"
import { markRequestExpired } from "./mark-request-expired"

const layer = InMemoryRequestRepositoryLayer

const run = <A, E>(effect: Effect.Effect<A, E, RequestRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("markRequestAwarded command", () => {
  it("transitions a request to awarded", async () => {
    const result = await run(markRequestAwarded("req-neuro-001", "bid-abc"))
    expect(result.status).toBe("awarded")
  })

  it("fails for nonexistent request", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(markRequestAwarded("nonexistent", "bid-abc"), layer),
    )
    expect(exit._tag).toBe("Failure")
  })
})

describe("markRequestExpired command", () => {
  it("transitions a request to expired", async () => {
    const result = await run(markRequestExpired("req-imaging-003"))
    expect(result.status).toBe("expired")
  })
})
