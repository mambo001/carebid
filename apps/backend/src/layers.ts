import { Layer } from "effect"

import { InMemoryRequestRepositoryLayer } from "./infra/persistence/in-memory-request-repository"
import { InMemorySessionRepositoryLayer } from "./infra/persistence/in-memory-session-repository"
import { makePrismaRequestRepositoryLayer } from "./infra/persistence/request-repository"
import { makePrismaSessionRepositoryLayer } from "./infra/persistence/session-repository"

export const makeAppLayer = (env: Env) => {
  const requestLayer = env.DATABASE_URL
    ? makePrismaRequestRepositoryLayer(env.DATABASE_URL)
    : InMemoryRequestRepositoryLayer

  const sessionLayer = env.DATABASE_URL
    ? makePrismaSessionRepositoryLayer(env.DATABASE_URL)
    : InMemorySessionRepositoryLayer

  return Layer.mergeAll(requestLayer, sessionLayer)
}

export type AppServices = Layer.Layer.Success<ReturnType<typeof makeAppLayer>>
