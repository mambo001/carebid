import { NodeHttpServer } from "@effect/platform-node"
import { Layer, Effect } from "effect"
import { HttpServer } from "@effect/platform"
import { createServer } from "http"

import { router } from "./program"
import { AppLayer } from "./environments/environment.dev"

const NodeServerLive = NodeHttpServer.layer(() => createServer(), { port: 3000 })

const ServerLive = router.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress,
  Layer.provide(NodeServerLive)
)

// Provide all layers and launch
const run = Layer.provide(ServerLive, AppLayer)

// @ts-ignore - Type system thinks we still need CareRequests etc, but they're provided by AppLayer
Effect.runFork(Layer.launch(run))

// Keep the process alive
setInterval(() => {}, 1000)
