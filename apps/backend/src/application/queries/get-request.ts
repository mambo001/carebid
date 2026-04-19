import { Effect } from "effect"

import type { RequestSummary } from "@carebid/shared"

import type { DatabaseError, RequestNotFoundError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"

export const getRequest = (
  requestId: string,
): Effect.Effect<RequestSummary, RequestNotFoundError | DatabaseError, RequestRepository> =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.getRequest(requestId)
  })
