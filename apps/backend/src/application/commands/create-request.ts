import { Effect } from "effect"

import type { CreateCareRequestInput } from "@carebid/shared"

import { RequestRepository } from "../../domain/ports/request-repository"

export const createRequest = (input: CreateCareRequestInput) =>
  Effect.gen(function* () {
    const repo = yield* RequestRepository
    return yield* repo.createRequest(input)
  })
