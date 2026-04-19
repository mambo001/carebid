import { Context, Effect } from "effect"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

import { DatabaseError, SessionError } from "../errors"

export interface SessionRepository {
  readonly getSession: () => Effect.Effect<AppSession, DatabaseError | SessionError>
  readonly switchRole: (role: AppSession["role"]) => Effect.Effect<AppSession, DatabaseError | SessionError>
  readonly savePatient: (
    input: PatientOnboardingInput,
  ) => Effect.Effect<{ profile: PatientProfile; session: AppSession }, DatabaseError | SessionError>
  readonly saveProvider: (
    input: ProviderOnboardingInput,
  ) => Effect.Effect<{ profile: ProviderProfile; session: AppSession }, DatabaseError | SessionError>
}

export const SessionRepository = Context.GenericTag<SessionRepository>("@carebid/SessionRepository")
