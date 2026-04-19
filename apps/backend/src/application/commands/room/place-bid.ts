import { Effect, Either } from "effect"

import type { BidInput } from "@carebid/shared"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError, RoomNotOpenError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"
import { placeBid } from "../../../domain/room"

export const placeBidCommand = (
  input: BidInput,
): Effect.Effect<RoomState, RoomNotOpenError | DatabaseError, RoomGateway> =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(input.requestId)
    const result = placeBid(state, input)

    if (Either.isLeft(result)) {
      return yield* Effect.fail(result.left)
    }

    const next = result.right
    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
