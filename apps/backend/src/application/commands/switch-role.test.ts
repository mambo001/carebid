import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { switchRole } from "./switch-role"
import type { AuthIdentity } from "../../domain/ports/session-repository"

const layer = InMemorySessionRepositoryLayer
const testIdentity: AuthIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

const run = <A, E>(effect: Effect.Effect<A, E, SessionRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("switchRole command", () => {
  it("switches to patient role", async () => {
    const session = await run(switchRole(testIdentity, "patient"))
    expect(session.role).toBe("patient")
  })

  it("switches to provider role", async () => {
    const session = await run(switchRole(testIdentity, "provider"))
    expect(session.role).toBe("provider")
  })
})
