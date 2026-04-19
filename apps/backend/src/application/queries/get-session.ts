import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"

export const getSession = () =>
  Effect.gen(function* () {
    const repo = yield* SessionRepository
    return yield* repo.getSession()
  })
