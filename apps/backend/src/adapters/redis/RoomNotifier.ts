import { Effect, Layer } from "effect"
import { RoomNotifier } from "../../ports/RoomNotifier"
import { RequestId } from "../../data/branded"
import { makeRedisClient } from "./lib/redis-client"
import { RedisError } from "../../data/errors"

export const make = Effect.gen(function* () {
  const redis = yield* makeRedisClient

  const notifyRoomUpdated = (requestId: RequestId) =>
    Effect.tryPromise({
      try: () => redis.publish(`room:${requestId}`, "updated"),
      catch: (error) => new RedisError({ cause: error }),
    }).pipe(Effect.ignoreLogged)

  return RoomNotifier.of({ notifyRoomUpdated })
})

export const layer = Layer.effect(RoomNotifier, make)
