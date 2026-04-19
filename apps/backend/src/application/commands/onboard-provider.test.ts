import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "../../infra/persistence/in-memory-session-repository"
import { onboardProvider } from "./onboard-provider"
import type { AuthIdentity } from "../../domain/ports/session-repository"

const layer = InMemorySessionRepositoryLayer
const testIdentity: AuthIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

const run = <A, E>(effect: Effect.Effect<A, E, SessionRepository>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("onboardProvider command", () => {
  it("creates a provider profile and updates the session", async () => {
    const result = await run(
      onboardProvider(testIdentity, {
        displayName: "Dr. Bob",
        email: "bob@clinic.com",
        licenseRegion: "Metro Manila",
        categories: ["specialist_consult"],
      }),
    )
    expect(result.profile.displayName).toBe("Dr. Bob")
    expect(result.profile.verificationStatus).toBe("verified")
    expect(result.session.role).toBe("provider")
    expect(result.session.providerProfile?.displayName).toBe("Dr. Bob")
  })
})
