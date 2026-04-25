import { Context, Effect } from "effect"
import { UserId } from "../data/branded"
import { User } from "../data/entities"

export class Users extends Context.Tag("@carebid/Users")<
  Users,
  {
    readonly findById: (id: UserId) => Effect.Effect<User>
    readonly findByFirebaseUid: (uid: string) => Effect.Effect<User>
    readonly save: (user: User) => Effect.Effect<void>
  }
>() {}
