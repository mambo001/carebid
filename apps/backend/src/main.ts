import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Config, Layer } from "effect"
import { HttpServer } from "@effect/platform"

import { router } from "./program"
import { AppLayer } from "./environments/environment.dev"

const config = Effect.gen(function* () {
  const port = yield* Config.number("PORT").pipe(Config.withDefault(3000))
  return { port }
})

const HttpLive = Effect.gen(function* () {
  const { port } = yield* config
  const serverLayer = router.pipe(
    HttpServer.serve(),
    HttpServer.withLogAddress,
    Layer.provide(BunHttpServer.layer({ port }))
  )
  return serverLayer
})

const Main = Effect.gen(function* () {
  const serverLayer = yield* HttpLive
  const appLayer = serverLayer.pipe(Layer.provide(AppLayer))
  yield* Layer.launch(appLayer)
})

BunRuntime.runMain(Main)
