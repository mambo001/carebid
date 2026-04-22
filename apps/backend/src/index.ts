import { HttpServer } from "@effect/platform"
import * as BunHttpServer from "@effect/platform-bun/BunHttpServer"
import * as BunRuntime from "@effect/platform-bun/BunRuntime"
import { Effect, Layer } from "effect"

import { makeServerLayer } from "./app"
import { getAppConfig } from "./shared/config/runtime-env"
import { SseRegistry } from "./domain/ports/sse-registry"
import { LiveSseRegistryLayer } from "./infra/realtime/sse-registry"
import { startRedisRoomSubscriber } from "./infra/realtime/redis-room-subscriber"

const config = getAppConfig()

const MainLive = makeServerLayer(config).pipe(
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: config.port })),
)

BunRuntime.runMain(Layer.launch(MainLive))

Effect.runPromise(
  Effect.gen(function* () {
    const registry = yield* Effect.provide(SseRegistry, LiveSseRegistryLayer)
    yield* Effect.provide(startRedisRoomSubscriber(config, registry), Layer.empty)
  }),
)
