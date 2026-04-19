import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const markRequestExpired = (requestId: string) =>
  Effect.flatMap(RequestRepository, (repository) => Effect.tryPromise(() => repository.markRequestExpired(requestId)))
