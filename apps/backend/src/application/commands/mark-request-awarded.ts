import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const markRequestAwarded = (requestId: string, bidId: string) =>
  Effect.flatMap(RequestRepository, (repository) =>
    Effect.tryPromise(() => repository.markRequestAwarded(requestId, bidId)),
  )
