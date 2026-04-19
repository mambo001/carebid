import { Effect, Layer } from "effect"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

const demoAuthUserId = "demo-user-001"
const demoEmail = "demo@carebid.local"

export const makeInMemorySessionRepository = (): SessionRepository => {
  let patientProfile: PatientProfile | undefined
  let providerProfile: ProviderProfile | undefined
  let activeRole: AppSession["role"]

  const buildSession = (): AppSession => ({
    mode: "demo",
    authUserId: demoAuthUserId,
    email: demoEmail,
    role: activeRole,
    patientProfile,
    providerProfile,
  })

  return {
    getSession: () => Effect.succeed(buildSession()),

    switchRole: (role) => {
      activeRole = role
      return Effect.succeed(buildSession())
    },

    savePatient: (input: PatientOnboardingInput) => {
      patientProfile = {
        id: `pat-${crypto.randomUUID()}`,
        authUserId: demoAuthUserId,
        email: input.email,
        displayName: input.displayName,
        locationCity: input.locationCity,
        locationRegion: input.locationRegion,
      }
      activeRole = "patient"
      return Effect.succeed({ profile: patientProfile, session: buildSession() })
    },

    saveProvider: (input: ProviderOnboardingInput) => {
      providerProfile = {
        id: `pro-${crypto.randomUUID()}`,
        authUserId: demoAuthUserId,
        email: input.email,
        displayName: input.displayName,
        licenseRegion: input.licenseRegion,
        verificationStatus: "verified",
        verificationMode: "demo_auto",
        categories: input.categories,
      }
      activeRole = "provider"
      return Effect.succeed({ profile: providerProfile, session: buildSession() })
    },
  }
}

export const InMemorySessionRepositoryLayer = Layer.sync(SessionRepository, makeInMemorySessionRepository)
