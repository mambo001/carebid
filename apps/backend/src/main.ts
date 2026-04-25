import { Effect, Layer, Config } from "effect"
import { BunHttpServer } from "@effect/platform-bun"
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

Effect.runFork(Main)
