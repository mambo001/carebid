import { Context, Effect } from "effect"
import { RequestId, UserId } from "../data/branded"
import { CareRequest } from "../data/entities"
import { RequestNotFound, DatabaseError } from "../data/errors"

export class CareRequests extends Context.Tag("@carebid/CareRequests")<
  CareRequests,
  {
    readonly findById: (id: RequestId) => Effect.Effect<CareRequest, RequestNotFound | DatabaseError>
    readonly findByPatient: (patientId: UserId) => Effect.Effect<ReadonlyArray<CareRequest>, DatabaseError>
    readonly save: (request: CareRequest) => Effect.Effect<void, DatabaseError>
  }
>() {}
