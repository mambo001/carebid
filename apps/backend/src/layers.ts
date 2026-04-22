import { Layer } from "effect"

import type { AppConfig } from "./shared/config/runtime-env"
import { InMemoryRequestRepositoryLayer } from "./infra/persistence/in-memory-request-repository"
import { InMemorySessionRepositoryLayer } from "./infra/persistence/in-memory-session-repository"
import { makePrismaRequestRepositoryLayer } from "./infra/persistence/request-repository"
import { makePrismaRoomRepositoryLayer } from "./infra/persistence/room-repository"
import { makePrismaSessionRepositoryLayer } from "./infra/persistence/session-repository"
import { makeFirebaseAuthProviderLayer } from "./infra/auth/firebase-auth-provider"
import { makeRedisRoomNotifierLayer } from "./infra/realtime/redis-room-notifier"

export const makeAppLayer = (config: AppConfig) => {
  const requestLayer = config.databaseUrl
    ? makePrismaRequestRepositoryLayer(config.databaseUrl)
    : InMemoryRequestRepositoryLayer

  const sessionLayer = config.databaseUrl
    ? makePrismaSessionRepositoryLayer(config.databaseUrl)
    : InMemorySessionRepositoryLayer

  const roomLayer = makePrismaRoomRepositoryLayer(config.databaseUrl)
  const authLayer = makeFirebaseAuthProviderLayer(config)
  const notifierLayer = makeRedisRoomNotifierLayer(config)

  return Layer.mergeAll(requestLayer, sessionLayer, roomLayer, authLayer, notifierLayer)
}

export type AppServices = Layer.Layer.Success<ReturnType<typeof makeAppLayer>>
