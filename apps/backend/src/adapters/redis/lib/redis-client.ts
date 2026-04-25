import { Effect, Config } from "effect"
import Redis from "ioredis"
import { RedisError } from "../../../data/errors"

export const makeRedisClient = Effect.gen(function* () {
  const redisUrl = yield* Config.string("REDIS_URL")
  const maxRetries = yield* Config.number("REDIS_MAX_RETRIES").pipe(Config.withDefault(3))
  const client = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: maxRetries })
  yield* Effect.tryPromise({
    try: () => client.connect(),
    catch: (error) => new RedisError({ cause: error }),
  })
  return client
})

export const makeRedisSubscriber = Effect.gen(function* () {
  const redisUrl = yield* Config.string("REDIS_URL")
  const subscriber = new Redis(redisUrl, { lazyConnect: true })
  yield* Effect.tryPromise({
    try: () => subscriber.connect(),
    catch: (error) => new RedisError({ cause: error }),
  })
  return subscriber
})
