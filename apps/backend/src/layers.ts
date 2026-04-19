import { Layer } from "effect"

import { makeRequestRepositoryLayer } from "./infra/persistence/request-repository"
import { makeSessionRepositoryLayer } from "./infra/persistence/session-repository"

export const makeAppLayer = (env: Env) =>
  Layer.mergeAll(
    makeSessionRepositoryLayer(env),
    makeRequestRepositoryLayer(env),
  )
