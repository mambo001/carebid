import { NodeHttpServer } from "@effect/platform-node"
import { Layer, Effect } from "effect"
import { HttpServer, HttpRouter, HttpServerResponse } from "@effect/platform"
import { createServer } from "http"

import { CareRequests } from "./ports/CareRequests"
import { Bids } from "./ports/Bids"
import { Users } from "./ports/Users"
import { RoomNotifier } from "./ports/RoomNotifier"
import { SseRegistry } from "./ports/SseRegistry"
import { RequestCommands } from "./ports/RequestCommands"
import { AuthProvider } from "./ports/AuthProvider"

import * as CareRequestsAdapter from "./adapters/in-memory/CareRequests"
import * as BidsAdapter from "./adapters/in-memory/Bids"
import * as UsersAdapter from "./adapters/in-memory/Users"
import * as RoomNotifierAdapter from "./adapters/in-memory/RoomNotifier"
import * as SseRegistryAdapter from "./adapters/in-memory/SseRegistry"
import * as RequestCommandsAdapter from "./adapters/in-memory/RequestCommands"
import { Unauthorized } from "./data/errors"
import { UserId } from "./data/branded"

// Mock auth provider for dev
const AuthProviderLive = Layer.effect(
  AuthProvider,
  Effect.gen(function* () {
    const verifyToken = (token: string) => {
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

// Compose all layers
const AppLayer = Layer.mergeAll(
  CareRequestsAdapter.layer,
  BidsAdapter.layer,
  UsersAdapter.layer,
  RoomNotifierAdapter.layer,
  SseRegistryAdapter.layer,
  RequestCommandsAdapter.layer,
  AuthProviderLive
)

// Simple router - for now just health endpoint to prove it works
const router = HttpRouter.empty.pipe(
  HttpRouter.get("/health", Effect.succeed(HttpServerResponse.text("ok")))
)

const NodeServerLive = NodeHttpServer.layer(() => createServer(), { port: 3000 })

const ServerLive = router.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress,
  Layer.provide(NodeServerLive)
)

// Use Node.js runtime
Layer.launch(ServerLive).pipe(Effect.runPromise)
