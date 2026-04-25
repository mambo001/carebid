import { Effect, Layer, Ref } from "effect"
import { Users } from "../../ports/Users"
import { UserId } from "../../data/branded"
import { User } from "../../data/entities"

export const make = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<string, User>())

  const findById = (id: UserId) =>
    Ref.get(store).pipe(
      Effect.map((map) => map.get(id)),
      Effect.flatMap((user) =>
        user
          ? Effect.succeed(user)
          : Effect.die(new Error(`User not found: ${id}`))
      )
    )

  const findByFirebaseUid = (uid: string) =>
    Ref.get(store).pipe(
      Effect.map((map) =>
        Array.from(map.values()).find((u) => u.id === uid)
      ),
      Effect.flatMap((user) =>
        user
          ? Effect.succeed(user)
          : Effect.die(new Error(`User not found by Firebase UID: ${uid}`))
      )
    )

  const save = (user: User) =>
    Ref.update(store, (map) => new Map(map).set(user.id, user))

  return Users.of({ findById, findByFirebaseUid, save })
})

export const layer = Layer.effect(Users, make)
