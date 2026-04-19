import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { getSession } from "./get-session"

const layer = InMemorySessionRepositoryLayer

describe("getSession query", () => {
  it("returns the demo session", async () => {
    const session = await Effect.runPromise(
      Effect.provide(getSession(), layer),
    )
    expect(session.mode).toBe("demo")
    expect(session.authUserId).toBe("demo-user-001")
    expect(session.email).toBe("demo@carebid.local")
  })
})
