import { Effect, Layer } from "effect"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

import { SessionRepository, type AuthIdentity } from "../../domain/ports/session-repository"

export const makeInMemorySessionRepository = (): SessionRepository => {
  let patientProfile: PatientProfile | undefined
  let providerProfile: ProviderProfile | undefined
  let activeRole: AppSession["role"]
  let currentIdentity: AuthIdentity = { authUserId: "in-memory-user", email: "mem@carebid.local" }

  const buildSession = (): AppSession => ({
    mode: "demo",
    authUserId: currentIdentity.authUserId,
    email: currentIdentity.email,
    role: activeRole,
    patientProfile,
    providerProfile,
  })

  return {
    getSession: (identity) => {
      currentIdentity = identity
      return Effect.succeed(buildSession())
    },

    switchRole: (identity, role) => {
      currentIdentity = identity
      activeRole = role
      return Effect.succeed(buildSession())
    },

    savePatient: (identity, input: PatientOnboardingInput) => {
      
      currentIdentity = identity
      patientProfile = {
        id: `pat-${crypto.randomUUID()}`,
        authUserId: identity.authUserId,
        email: input.email,
        displayName: input.displayName,
        locationCity: input.locationCity,
        locationRegion: input.locationRegion,
      }
      activeRole = "patient"
      return Effect.succeed({ profile: patientProfile, session: buildSession() })
    },

    saveProvider: (identity, input: ProviderOnboardingInput) => {
      currentIdentity = identity
      providerProfile = {
        id: `pro-${crypto.randomUUID()}`,
        authUserId: identity.authUserId,
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
