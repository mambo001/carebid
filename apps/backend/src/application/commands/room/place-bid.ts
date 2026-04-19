import { Effect, Either } from "effect"

import type { BidInput } from "@carebid/shared"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { placeBid } from "../../../domain/room"

export const placeBidCommand = (input: BidInput) =>
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
