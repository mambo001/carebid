import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"
import { InMemoryRequestRepositoryLayer } from "../../infra/persistence/in-memory-request-repository"
import { getRequest } from "./get-request"

const layer = InMemoryRequestRepositoryLayer

describe("getRequest query", () => {
  it("returns a request by id", async () => {
    const item = await Effect.runPromise(
      Effect.provide(getRequest("req-neuro-001"), layer),
    )
    expect(item.id).toBe("req-neuro-001")
  })

  it("fails for nonexistent request", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(getRequest("nonexistent"), layer),
    )
    expect(exit._tag).toBe("Failure")
  })
})
