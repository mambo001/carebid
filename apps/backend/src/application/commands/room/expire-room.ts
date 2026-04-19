import { Effect, Either } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError, RoomNotOpenError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"
import { expireRoom } from "../../../domain/room"

export const expireRoomCommand = (
  requestId: string,
): Effect.Effect<RoomState, RoomNotOpenError | DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(requestId)
    const result = expireRoom(state)

    if (Either.isLeft(result)) {
      return yield* Effect.fail(result.left)
    }

    const next = result.right
    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
