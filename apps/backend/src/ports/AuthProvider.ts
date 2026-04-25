import { Context, Effect, Schema } from "effect"
import { UserId } from "../data/branded"
import { Unauthorized } from "../data/errors"

export class AuthIdentity extends Schema.Class("AuthIdentity")({
  userId: UserId,
  firebaseUid: Schema.String,
  email: Schema.String,
  roles: Schema.Array(Schema.Literal("patient", "provider")),
}) {}

export class AuthProvider extends Context.Tag("@carebid/AuthProvider")<
  AuthProvider,
  {
    readonly verifyToken: (token: string) => Effect.Effect<AuthIdentity, Unauthorized>
  }
>() {}
