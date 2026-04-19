import { Effect } from "effect"

import { SessionRepository } from "../../domain/ports/session-repository"

export const getSession = () =>
  Effect.flatMap(SessionRepository, (repository) => Effect.tryPromise(() => repository.getSession()))
