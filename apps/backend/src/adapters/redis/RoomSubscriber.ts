import { Effect, Layer, Queue, Stream, Schema } from "effect"

import { RequestId } from "../../data/branded"
import { CareRequest } from "../../data/entities"
import { CareRequests } from "../../ports/CareRequests"
import { RoomSubscriber } from "../../ports/RoomSubscriber"
import { SseRegistry } from "../../ports/SseRegistry"
import { RedisError } from "../../data/errors"
import { serializeCareRequest } from "../../integration/serialization"
import { makeRedisSubscriber } from "./lib/redis-client"

export const roomChannelRequestId = (channel: string): string | null => {
  const prefix = "room:"
  if (!channel.startsWith(prefix)) return null

  const requestId = channel.slice(prefix.length)
  return requestId.length > 0 ? requestId : null
}

export const roomUpdatePayload = (request: CareRequest) =>
  JSON.stringify({ request: serializeCareRequest(request) })

export const make = Effect.gen(function* () {
  const redis = yield* makeRedisSubscriber
  const careRequests = yield* CareRequests
  const sseRegistry = yield* SseRegistry

  const messageQueue = yield* Queue.unbounded<string>()

  const handleMessage = (channel: string) =>
    Effect.gen(function* () {
      const requestId = roomChannelRequestId(channel)
      if (requestId === null) return

      const brandedRequestId = Schema.decodeUnknownSync(RequestId)(requestId)
      const request = yield* careRequests.findById(brandedRequestId)
      yield* sseRegistry.broadcast(brandedRequestId, roomUpdatePayload(request))
    }).pipe(
      Effect.catchAll((error) =>
        Effect.logError("Failed to bridge Redis room update to SSE registry").pipe(
          Effect.annotateLogs({ channel, error })
        )
      )
    )

  yield* Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => redis.psubscribe("room:*"),
      catch: (error) => new RedisError({ cause: error }),
    })

    redis.on("pmessage", (_pattern, channel) => {
      Effect.runFork(Queue.offer(messageQueue, channel))
    })

    yield* Stream.fromQueue(messageQueue).pipe(
      Stream.runForEach((channel) => handleMessage(channel))
    )
  }).pipe(
    Effect.ensuring(
      Effect.promise(() => redis.punsubscribe("room:*"))
    ),
    Effect.catchAll((error) =>
      Effect.logError("Redis room subscriber daemon stopped").pipe(
        Effect.annotateLogs({ error })
      )
    ),
    Effect.forkDaemon
  )

  return RoomSubscriber.of({ _tag: "RoomSubscriber" })
})

export const layer = Layer.effect(RoomSubscriber, make)
