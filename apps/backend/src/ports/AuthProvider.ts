import { Context, Effect } from "effect"
import { UserId } from "../data/branded"
import { Unauthorized } from "../data/errors"

export interface AuthIdentity {
  readonly userId: UserId
  readonly firebaseUid: string
  readonly email: string
  readonly roles: ReadonlyArray<"patient" | "provider">
}

export class AuthProvider extends Context.Tag("@carebid/AuthProvider")<
  AuthProvider,
  {
    readonly verifyToken: (token: string) => Effect.Effect<AuthIdentity, Unauthorized>
  }
>() {}
