import { Layer } from "effect"
import * as RoomNotifier from "../adapters/redis/RoomNotifier"
import * as SseRegistry from "../adapters/in-memory/SseRegistry"
import * as AuthProvider from "../adapters/firebase/AuthProvider"

// Using in-memory repos for now until Prisma adapters are fully implemented
import * as CareRequests from "../adapters/in-memory/CareRequests"
import * as Bids from "../adapters/in-memory/Bids"
import * as Users from "../adapters/in-memory/Users"

export const AppLayer = Layer.mergeAll(
  CareRequests.layer,
  Bids.layer,
  Users.layer,
  RoomNotifier.layer,
  SseRegistry.layer,
  AuthProvider.layer
)
