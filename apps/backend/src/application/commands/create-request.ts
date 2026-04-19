import { Effect } from "effect"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

import type { DatabaseError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"

export const createRequest = (
  input: CreateCareRequestInput,
): Effect.Effect<RequestSummary, DatabaseError, RequestRepository> =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.createRequest(input)
  })
