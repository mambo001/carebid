import { Effect, Config } from "effect"
import Redis from "ioredis"

export const makeRedisClient = Effect.gen(function* () {
  const redisUrl = yield* Config.string("REDIS_URL")
  const client = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 })
  yield* Effect.promise(() => client.connect())
  return client
})
