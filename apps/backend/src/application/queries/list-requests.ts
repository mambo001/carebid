import { Effect } from "effect"

import type { RequestSummary } from "@carebid/shared"

import type { DatabaseError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"

export const listRequests = (): Effect.Effect<readonly RequestSummary[], DatabaseError, RequestRepository> =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.listRequests()
  })
