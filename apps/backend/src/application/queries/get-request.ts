import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const getRequest = (requestId: string) =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.getRequest(requestId)
  })
