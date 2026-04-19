import { Effect } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"

export const getRoomSnapshotQuery = (
  requestId: string,
  initialStatus?: RoomState["status"],
): Effect.Effect<RoomState, DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    return yield* gateway.getRoomState(requestId, initialStatus)
  })
