import { Effect } from "effect"

import { RequestRepository } from "../../domain/ports/request-repository"

export const listRequests = () =>
  Effect.flatMap(RequestRepository, (repository) => Effect.tryPromise(() => repository.listRequests()))
