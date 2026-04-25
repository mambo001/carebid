import { NodeHttpServer } from "@effect/platform-node"
import { Layer } from "effect"
import { HttpServer } from "@effect/platform"
import { createServer } from "http"

import { router } from "../program"

import * as CareRequestsAdapter from "../adapters/prisma/CareRequests"
import * as BidsAdapter from "../adapters/prisma/Bids"
import * as UsersAdapter from "../adapters/in-memory/Users"
import * as RoomNotifierAdapter from "../adapters/in-memory/RoomNotifier"
import * as SseRegistryAdapter from "../adapters/in-memory/SseRegistry"
import * as RequestCommandsAdapter from "../adapters/in-memory/RequestCommands"
import * as FirebaseAuthAdapter from "../adapters/firebase/AuthProvider"

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

const NodeServerLive = NodeHttpServer.layer(() => createServer(), { port, host: "0.0.0.0" })

// Base layers have no dependencies
const BaseLayers = Layer.mergeAll(
  CareRequestsAdapter.layer,
  BidsAdapter.layer,
  UsersAdapter.layer,
  RoomNotifierAdapter.layer,
  SseRegistryAdapter.layer,
  FirebaseAuthAdapter.layer
)

// RequestCommands depends on base layers
const RequestCommandsLive = RequestCommandsAdapter.layer.pipe(
  Layer.provide(BaseLayers)
)

// All service layers combined
const AllServices = Layer.mergeAll(
  BaseLayers,
  RequestCommandsLive
)

// Build the server layer from the router
const ServerLive = router.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress
)

// Export the main Effect with all layers provided
export const main = ServerLive.pipe(
  Layer.provide(AllServices),
  Layer.provide(NodeServerLive),
  Layer.launch
)
