import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"
import { InMemorySessionRepositoryLayer } from "./in-memory-session-repository"

const run = <A, E>(effect: Effect.Effect<A, E, SessionRepository>) =>
  Effect.runPromise(Effect.provide(effect, InMemorySessionRepositoryLayer))

const testIdentity = { authUserId: "test-user-001", email: "test@carebid.local" }

describe("InMemorySessionRepository", () => {
  it("returns a demo session", async () => {
    const session = await run(
      Effect.gen(function* () {
        const repo = yield* SessionRepository
        return yield* repo.getSession(testIdentity)
      }),
    )
    expect(session.mode).toBe("demo")
    expect(session.authUserId).toBe("test-user-001")
    expect(session.email).toBe("test@carebid.local")
    expect(session.role).toBeUndefined()
  })

  it("switches role", async () => {
    const session = await run(
      Effect.gen(function* () {
        const repo = yield* SessionRepository
        return yield* repo.switchRole(testIdentity, "patient")
      }),
    )
    expect(session.role).toBe("patient")
  })

  it("saves a patient profile and sets role", async () => {
    const result = await run(
      Effect.gen(function* () {
        const repo = yield* SessionRepository
        return yield* repo.savePatient(testIdentity, {
          displayName: "Test Patient",
          email: "patient@test.com",
          locationCity: "Manila",
          locationRegion: "Metro Manila",
        })
      }),
    )
    expect(result.profile.displayName).toBe("Test Patient")
    expect(result.profile.id).toMatch(/^pat-/)
    expect(result.session.role).toBe("patient")
    expect(result.session.patientProfile).toBeDefined()
  })

  it("saves a provider profile and sets role", async () => {
    const result = await run(
      Effect.gen(function* () {
        const repo = yield* SessionRepository
        return yield* repo.saveProvider(testIdentity, {
          displayName: "Test Provider",
          email: "provider@test.com",
          licenseRegion: "Metro Manila",
          categories: ["specialist_consult"],
        })
      }),
    )
    expect(result.profile.displayName).toBe("Test Provider")
    expect(result.profile.id).toMatch(/^pro-/)
    expect(result.profile.verificationStatus).toBe("verified")
    expect(result.profile.verificationMode).toBe("demo_auto")
    expect(result.session.role).toBe("provider")
    expect(result.session.providerProfile).toBeDefined()
  })
})
