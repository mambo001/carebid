import { Effect } from "effect"

import { RequestNotFoundError } from "../../domain/errors/request-not-found"
import { RequestRepository } from "../../domain/ports/request-repository"

export const getRequest = (requestId: string) =>
  Effect.flatMap(RequestRepository, (repository) =>
    Effect.tryPromise(() => repository.getRequest(requestId)).pipe(
      Effect.flatMap((request) => (request ? Effect.succeed(request) : Effect.fail(new RequestNotFoundError({ requestId })))),
    ),
  )
