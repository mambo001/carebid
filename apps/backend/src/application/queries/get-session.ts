import { Effect } from "effect"

import type { AppSession } from "@carebid/shared"

import type { DatabaseError, SessionError } from "../../domain/errors"
import { SessionRepository, type AuthIdentity } from "../../domain/ports/session-repository"

export const getSession = (
  identity: AuthIdentity,
): Effect.Effect<AppSession, DatabaseError | SessionError, SessionRepository> =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.getSession(identity)
  })
