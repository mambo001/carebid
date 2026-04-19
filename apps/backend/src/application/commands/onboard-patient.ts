import { Effect } from "effect"

import type { PatientOnboardingInput } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const onboardPatient = (input: PatientOnboardingInput) =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.savePatient(input)
  })
