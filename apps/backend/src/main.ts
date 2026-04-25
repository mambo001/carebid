import { NodeHttpServer } from "@effect/platform-node"
import { Layer, Effect, Console } from "effect"
import { HttpServer } from "@effect/platform"
import { createServer } from "http"

import { router } from "./program"

// Import all adapters
import * as CareRequestsAdapter from "./adapters/in-memory/CareRequests"
import * as BidsAdapter from "./adapters/in-memory/Bids"
import * as UsersAdapter from "./adapters/in-memory/Users"
import * as RoomNotifierAdapter from "./adapters/in-memory/RoomNotifier"
import * as SseRegistryAdapter from "./adapters/in-memory/SseRegistry"
import * as RequestCommandsAdapter from "./adapters/in-memory/RequestCommands"
import { AuthProvider, AuthIdentity } from "./ports/AuthProvider"
import { Unauthorized } from "./data/errors"
import { UserId } from "./data/branded"

// Create all layers
const AuthProviderLive = Layer.effect(
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

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const NodeServerLive = NodeHttpServer.layer(() => createServer(), { port })

// Build the server
const ServerLive = router.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress
)

// Build layers with proper dependency injection
const BaseLayers = Layer.mergeAll(
  CareRequestsAdapter.layer,
  BidsAdapter.layer,
  UsersAdapter.layer,
  RoomNotifierAdapter.layer,
  SseRegistryAdapter.layer,
  AuthProviderLive
)

const RequestCommandsLive = RequestCommandsAdapter.layer.pipe(
  Layer.provide(BaseLayers)
)

const AllServices = Layer.mergeAll(
  BaseLayers,
  RequestCommandsLive
)

const AppLive = ServerLive.pipe(
  Layer.provide(AllServices),
  Layer.provide(NodeServerLive)
)

const launch = Layer.launch(AppLive).pipe(
  Effect.tap(() => Console.log(`Server launched successfully on port ${port}`)),
  Effect.catchAll((error) => Console.error("Failed to launch:", error))
)

Console.log("Starting server...").pipe(Effect.runSync)

Effect.runPromise(launch).then(() => {
  console.log(`Server is running on port ${port}`)
}).catch((err) => {
  console.error("Server failed:", err)
  process.exit(1)
})

setInterval(() => {}, 1000)
