import Redis from "ioredis"
import { Effect, Layer } from "effect"

import type { AppConfig } from "../../shared/config/runtime-env"
import { RoomNotifier } from "../../domain/ports/room-notifier"

const getPublisher = (redisUrl: string | undefined) => {
  if (!redisUrl) {
    return null
  }

  return new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
}

export const makeRedisRoomNotifier = (config: AppConfig) => {
  const publisher = getPublisher(config.redisUrl)

  return {
    notifyRoomUpdated: (requestId: string): Effect.Effect<void, never> =>
      Effect.tryPromise({
        try: async () => {
          if (!publisher) {
            return
          }

          if (publisher.status === "wait") {
            await publisher.connect()
          }

          await publisher.publish(`room:${requestId}`, JSON.stringify({ requestId, timestamp: new Date().toISOString() }))
        },
        catch: (error) => error,
      }).pipe(Effect.catchAll(() => Effect.void)),
  }
}

export const makeRedisRoomNotifierLayer = (config: AppConfig) =>
  Layer.succeed(RoomNotifier, makeRedisRoomNotifier(config))
