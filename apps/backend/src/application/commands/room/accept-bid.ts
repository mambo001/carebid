import { Effect, Either } from "effect"

import type { AcceptBidInput } from "@carebid/shared"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { acceptBid } from "../../../domain/room"

export const acceptBidCommand = (input: AcceptBidInput) =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    const state = yield* gateway.getRoomState(input.requestId)
    const result = acceptBid(state, input)

    if (Either.isLeft(result)) {
      return yield* Effect.fail(result.left)
    }

    const next = result.right
    yield* gateway.putRoomState(next)
    yield* gateway.broadcast(next)

    return next
  })
