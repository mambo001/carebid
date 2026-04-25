import { Effect, Layer, Ref } from "effect"
import { CareRequests } from "../../ports/CareRequests"
import { RequestId, UserId } from "../../data/branded"
import { CareRequest } from "../../data/entities"
import { RequestNotFound } from "../../data/errors"

export const make = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<string, CareRequest>())

  const findById = (id: RequestId): Effect.Effect<CareRequest, RequestNotFound> =>
    Ref.get(store).pipe(
      Effect.map((map) => map.get(id)),
      Effect.flatMap((request) =>
        request ? Effect.succeed(request) : Effect.fail(new RequestNotFound({ requestId: id }))
      )
    )

  const findByPatient = (patientId: UserId): Effect.Effect<ReadonlyArray<CareRequest>> =>
    Ref.get(store).pipe(
      Effect.map((map) =>
        Array.from(map.values()).filter((r) => r.patientId === patientId)
      )
    )

  const findOpen = (): Effect.Effect<ReadonlyArray<CareRequest>> =>
    Ref.get(store).pipe(
      Effect.map((map) =>
        Array.from(map.values()).filter((r) => r._tag === "OpenRequest")
      )
    )

  const save = (request: CareRequest): Effect.Effect<void> =>
    Ref.update(store, (map) => new Map(map).set(request.id, request))

  return CareRequests.of({ findById, findByPatient, findOpen, save })
})

export const layer = Layer.effect(CareRequests, make)
