import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { onboardPatient } from "./onboard-patient"
import type { AuthIdentity } from "../../domain/ports/session-repository"

const layer = InMemorySessionRepositoryLayer
const testIdentity: AuthIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

const run = <A, E>(effect: Effect.Effect<A, E, SessionRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("onboardPatient command", () => {
  it("creates a patient profile and updates the session", async () => {
    const result = await run(
      onboardPatient(testIdentity, {
        displayName: "Alice Demo",
        email: "alice@test.com",
        locationCity: "Manila",
        locationRegion: "Metro Manila",
      }),
    )
    expect(result.profile.displayName).toBe("Alice Demo")
    expect(result.session.role).toBe("patient")
    expect(result.session.patientProfile?.displayName).toBe("Alice Demo")
  })
})
