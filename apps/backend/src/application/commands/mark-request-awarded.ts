import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const markRequestAwarded = (requestId: string, bidId: string) =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.markRequestAwarded(requestId, bidId)
  })
