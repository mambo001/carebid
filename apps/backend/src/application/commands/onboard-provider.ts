import { Effect } from "effect"

import type { ProviderOnboardingInput } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const onboardProvider = (input: ProviderOnboardingInput) =>
  Effect.flatMap(SessionRepository, (repository) => Effect.tryPromise(() => repository.saveProvider(input)))
