import { Layer, Effect } from "effect"
import * as CareRequests from "../adapters/in-memory/CareRequests"
import * as Bids from "../adapters/in-memory/Bids"
import * as Users from "../adapters/in-memory/Users"
import * as RoomNotifier from "../adapters/in-memory/RoomNotifier"
import * as SseRegistry from "../adapters/in-memory/SseRegistry"
import { AuthProvider, AuthIdentity } from "../ports/AuthProvider"
import { Unauthorized } from "../data/errors"
import { UserId } from "../data/branded"

const MockAuthProviderLive = Layer.effect(
  AuthProvider,
  Effect.gen(function* () {
    const verifyToken = (token: string) => {
      if (token === "dev-patient") {
        return Effect.succeed(
          new AuthIdentity({
            userId: UserId.makeUnsafe("dev-patient-id"),
            firebaseUid: "dev-patient-uid",
            email: "patient@example.com",
            roles: ["patient"],
          })
        )
      }
      if (token === "dev-provider") {
        return Effect.succeed(
          new AuthIdentity({
            userId: UserId.makeUnsafe("dev-provider-id"),
            firebaseUid: "dev-provider-uid",
            email: "provider@example.com",
            roles: ["provider"],
          })
        )
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
  MockAuthProviderLive
)
