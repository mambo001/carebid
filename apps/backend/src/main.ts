import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Layer, Effect } from "effect"
import { HttpServer, HttpRouter, HttpServerResponse } from "@effect/platform"

import { AppLayer } from "./environments/environment.dev"

// Simple health endpoint that doesn't need dependencies
const simpleRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/health", Effect.succeed(HttpServerResponse.text("ok")))
)

const BunServerLive = BunHttpServer.layer({ port: 3000 })

const ServerLive = simpleRouter.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress,
  Layer.provide(BunServerLive)
)

// For now, just run the simple server without the full AppLayer
// We'll integrate the full router once we solve the handler type issues
BunRuntime.runMain(Layer.launch(ServerLive))
