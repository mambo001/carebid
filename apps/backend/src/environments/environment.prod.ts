import { Layer } from "effect"
import * as RoomNotifier from "../adapters/redis/RoomNotifier"
import * as SseRegistry from "../adapters/in-memory/SseRegistry"
import * as AuthProvider from "../adapters/firebase/AuthProvider"
import * as CareRequests from "../adapters/prisma/CareRequests"
import * as Bids from "../adapters/prisma/Bids"
import * as Users from "../adapters/in-memory/Users"
import * as RequestCommands from "../adapters/in-memory/RequestCommands"

const UsersLive = Users.layer
const AuthProviderLive = AuthProvider.layer.pipe(
  Layer.provide(UsersLive)
)

// Base layers have no dependencies after auth receives the shared Users layer.
const BaseLayers = Layer.mergeAll(
  CareRequests.layer,
  Bids.layer,
  UsersLive,
  RoomNotifier.layer,
  SseRegistry.layer,
  AuthProviderLive
)

// RequestCommands depends on base layers
const RequestCommandsLive = RequestCommands.layer.pipe(
  Layer.provide(BaseLayers)
)

// All service layers combined
export const AppLayer = Layer.mergeAll(
  BaseLayers,
  RequestCommandsLive
)
