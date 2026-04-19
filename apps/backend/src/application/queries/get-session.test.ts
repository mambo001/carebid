import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { getSession } from "./get-session"
import type { AuthIdentity } from "../../domain/ports/session-repository"

const layer = InMemorySessionRepositoryLayer
const testIdentity: AuthIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

describe("getSession query", () => {
  it("returns the demo session", async () => {
    const session = await Effect.runPromise(
      Effect.provide(getSession(testIdentity), layer),
    )
    expect(session.mode).toBe("demo")
    expect(session.authUserId).toBe("test-user-001")
    expect(session.email).toBe("test@carebid.local")
  })
})
