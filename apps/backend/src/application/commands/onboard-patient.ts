import { Effect } from "effect"

import type { AppSession, PatientOnboardingInput, PatientProfile } from "@carebid/shared"

import type { DatabaseError, SessionError } from "../../domain/errors"
import { SessionRepository } from "../../domain/ports/session-repository"

export const onboardPatient = (
  input: PatientOnboardingInput,
): Effect.Effect<{ profile: PatientProfile; session: AppSession }, DatabaseError | SessionError, SessionRepository> =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.savePatient(input)
  })
