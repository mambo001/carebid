import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const markRequestExpired = (requestId: string) =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.markRequestExpired(requestId)
  })
