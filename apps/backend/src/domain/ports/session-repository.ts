import { Context, Effect } from "effect"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

import { DatabaseError, SessionError } from "../errors"

export type AuthIdentity = {
  readonly authUserId: string
  readonly email: string
}

export interface SessionRepository {
  readonly getSession: (identity: AuthIdentity) => Effect.Effect<AppSession, DatabaseError | SessionError>
  readonly switchRole: (identity: AuthIdentity, role: AppSession["role"]) => Effect.Effect<AppSession, DatabaseError | SessionError>
  readonly savePatient: (
    identity: AuthIdentity,
    input: PatientOnboardingInput,
  ) => Effect.Effect<{ profile: PatientProfile; session: AppSession }, DatabaseError | SessionError>
  readonly saveProvider: (
    identity: AuthIdentity,
    input: ProviderOnboardingInput,
  ) => Effect.Effect<{ profile: ProviderProfile; session: AppSession }, DatabaseError | SessionError>
}

export const SessionRepository = Context.GenericTag<SessionRepository>("@carebid/SessionRepository")
