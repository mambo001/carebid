import { Effect } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"
import { incrementViewers, decrementViewers } from "../../../domain/room"

export const connectViewerCommand = (
  requestId: string,
): Effect.Effect<RoomState, DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId)
    const next = incrementViewers(state)

    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })

export const disconnectViewerCommand = (
  requestId: string,
): Effect.Effect<RoomState, DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId)
    const next = decrementViewers(state)

    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
