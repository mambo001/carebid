import { Effect } from "effect"

import type { ProviderOnboardingInput } from "@carebid/shared"

import { SessionRepository } from "../../domain/ports/session-repository"

export const onboardProvider = (input: ProviderOnboardingInput) =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.saveProvider(input)
  })
