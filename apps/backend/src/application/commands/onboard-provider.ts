import { Effect } from "effect"

import type { AppSession, ProviderOnboardingInput, ProviderProfile } from "@carebid/shared"

import type { DatabaseError, SessionError } from "../../domain/errors"
import { SessionRepository, type AuthIdentity } from "../../domain/ports/session-repository"

export const onboardProvider = (
  identity: AuthIdentity,
  input: ProviderOnboardingInput,
): Effect.Effect<{ profile: ProviderProfile; session: AppSession }, DatabaseError | SessionError, SessionRepository> =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.saveProvider(identity, input)
  })
