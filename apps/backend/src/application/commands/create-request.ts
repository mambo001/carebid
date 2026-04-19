import { Effect } from "effect"

import type { CreateCareRequestInput } from "@carebid/shared"

import { RequestRepository } from "../../domain/ports/request-repository"

export const createRequest = (input: CreateCareRequestInput) =>
  Effect.flatMap(RequestRepository, (repository) => Effect.tryPromise(() => repository.createRequest(input)))
