import { Effect } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"
import { syncStatus } from "../../../domain/room"

export const syncRoomStatusCommand = (
  requestId: string,
  status: RoomState["status"],
): Effect.Effect<RoomState, DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId, status)
    const next = syncStatus(state, status)

    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
