import { Effect } from "effect"

import { RequestNotFoundError } from "../../domain/errors/request-not-found"
import { RequestRepository } from "../../domain/ports/request-repository"

export const openRequest = (requestId: string) =>
  Effect.flatMap(RequestRepository, (repository) =>
    Effect.tryPromise(() => repository.openRequest(requestId)).pipe(
      Effect.flatMap((request) => (request ? Effect.succeed(request) : Effect.fail(new RequestNotFoundError({ requestId })))),
    ),
  )
