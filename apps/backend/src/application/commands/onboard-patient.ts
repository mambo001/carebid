import { Effect } from "effect"

import type { PatientOnboardingInput } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const onboardPatient = (input: PatientOnboardingInput) =>
  Effect.flatMap(SessionRepository, (repository) => Effect.tryPromise(() => repository.savePatient(input)))
