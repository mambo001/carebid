import { Layer, Effect } from "effect"
import * as CareRequests from "../adapters/in-memory/CareRequests"
import * as Bids from "../adapters/in-memory/Bids"
import * as Users from "../adapters/in-memory/Users"
import * as RoomNotifier from "../adapters/in-memory/RoomNotifier"
import * as SseRegistry from "../adapters/in-memory/SseRegistry"
import * as RequestCommands from "../adapters/in-memory/RequestCommands"
import { AuthProvider, AuthIdentity } from "../ports/AuthProvider"
import { Unauthorized } from "../data/errors"
import { UserId } from "../data/branded"

const MockAuthProviderLive = Layer.effect(
  AuthProvider,
  Effect.gen(function* () {
    const verifyToken = (token: string): Effect.Effect<AuthIdentity, Unauthorized> => {
      if (token === "dev-patient") {
        return Effect.succeed({
          userId: "dev-patient-id" as UserId,
          firebaseUid: "dev-patient-uid",
          email: "patient@example.com",
          roles: ["patient"],
        })
      }
      if (token === "dev-provider") {
        return Effect.succeed({
          userId: "dev-provider-id" as UserId,
          firebaseUid: "dev-provider-uid",
          email: "provider@example.com",
          roles: ["provider"],
        })
      }
      return new Unauthorized({ message: "Invalid dev token" })
    }
    return AuthProvider.of({ verifyToken })
  })
)

export const AppLayer = Layer.mergeAll(
  CareRequests.layer,
  Bids.layer,
  Users.layer,
  RoomNotifier.layer,
  SseRegistry.layer,
  RequestCommands.layer,
  MockAuthProviderLive
)
