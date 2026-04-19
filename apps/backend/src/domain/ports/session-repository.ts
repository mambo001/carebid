import { Context } from "effect"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

export type SessionRepository = {
  getSession: () => Promise<AppSession>
  switchRole: (role: AppSession["role"]) => Promise<AppSession>
  savePatient: (input: PatientOnboardingInput) => Promise<{ profile: PatientProfile; session: AppSession }>
  saveProvider: (input: ProviderOnboardingInput) => Promise<{ profile: ProviderProfile; session: AppSession }>
}

export const SessionRepository = Context.GenericTag<SessionRepository>("@carebid/SessionRepository")
