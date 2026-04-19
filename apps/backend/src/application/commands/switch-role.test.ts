import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { switchRole } from "./switch-role"

const layer = InMemorySessionRepositoryLayer

const run = <A, E>(effect: Effect.Effect<A, E, SessionRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("switchRole command", () => {
  it("switches to patient role", async () => {
    const session = await run(switchRole("patient"))
    expect(session.role).toBe("patient")
  })

  it("switches to provider role", async () => {
    const session = await run(switchRole("provider"))
    expect(session.role).toBe("provider")
  })
})
