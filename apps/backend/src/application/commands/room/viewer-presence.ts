import { Effect } from "effect"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { incrementViewers, decrementViewers } from "../../../domain/room"

export const connectViewerCommand = (requestId: string) =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId)
    const next = incrementViewers(state)

    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })

export const disconnectViewerCommand = (requestId: string) =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId)
    const next = decrementViewers(state)

    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
