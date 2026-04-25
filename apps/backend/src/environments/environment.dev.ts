import { NodeHttpServer } from "@effect/platform-node"
import { Layer, Effect } from "effect"
import { HttpServer } from "@effect/platform"
import { createServer } from "http"

import { router } from "../program"

import * as CareRequestsAdapter from "../adapters/prisma/CareRequests"
import * as BidsAdapter from "../adapters/prisma/Bids"
import * as UsersAdapter from "../adapters/in-memory/Users"
import * as RoomNotifierAdapter from "../adapters/in-memory/RoomNotifier"
import * as SseRegistryAdapter from "../adapters/in-memory/SseRegistry"
import * as RequestCommandsAdapter from "../adapters/in-memory/RequestCommands"
import { AuthProvider, AuthIdentity } from "../ports/AuthProvider"
import { Unauthorized } from "../data/errors"
import { UserId } from "../data/branded"

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

const MockAuthProviderLive = Layer.effect(
  AuthProvider,
  Effect.gen(function* () {
    const verifyToken = (token: string): Effect.Effect<AuthIdentity, Unauthorized> => {
      if (token === "dev-patient") {
        return Effect.succeed({
          userId: "dev-patient-id" as UserId,
          firebaseUid: "dev-patient-uid",
          email: "patient@example.com",
          roles: ["patient"] as Array<"patient" | "provider">,
        })
      }
      if (token === "dev-provider") {
        return Effect.succeed({
          userId: "dev-provider-id" as UserId,
          firebaseUid: "dev-provider-uid",
          email: "provider@example.com",
          roles: ["provider"] as Array<"patient" | "provider">,
        })
      }
      return new Unauthorized({ message: "Invalid dev token" })
    }
    return AuthProvider.of({ verifyToken })
  })
)

const NodeServerLive = NodeHttpServer.layer(() => createServer(), { port, host: "0.0.0.0" })

// Base layers have no dependencies
const BaseLayers = Layer.mergeAll(
  CareRequestsAdapter.layer,
  BidsAdapter.layer,
  UsersAdapter.layer,
  RoomNotifierAdapter.layer,
  SseRegistryAdapter.layer,
  MockAuthProviderLive
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
