import { Effect, Layer, Ref } from "effect"
import { CareRequests } from "../../ports/CareRequests"
import { RequestId, UserId } from "../../data/branded"
import { CareRequest } from "../../data/entities"
import { RequestNotFound, DatabaseError } from "../../data/errors"

export const make = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<string, CareRequest>())

  const findById = (id: RequestId): Effect.Effect<CareRequest, RequestNotFound | DatabaseError> =>
    Ref.get(store).pipe(
      Effect.map((map) => map.get(id)),
      Effect.flatMap((request) =>
        request ? Effect.succeed(request) : Effect.fail(new RequestNotFound({ requestId: id }))
      )
    )

  const findByPatient = (patientId: UserId): Effect.Effect<ReadonlyArray<CareRequest>, DatabaseError> =>
    Ref.get(store).pipe(
      Effect.map((map) =>
        Array.from(map.values()).filter((r) => r.patientId === patientId)
      )
    )

  const save = (request: CareRequest): Effect.Effect<void, DatabaseError> =>
    Ref.update(store, (map) => new Map(map).set(request.id, request))

  return CareRequests.of({ findById, findByPatient, save })
})

export const layer = Layer.effect(CareRequests, make)
