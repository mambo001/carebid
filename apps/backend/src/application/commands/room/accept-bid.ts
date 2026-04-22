import { Effect } from "effect"

import type { AcceptBidInput } from "@carebid/shared"

import type { AuthIdentity } from "../../../domain/ports/session-repository"
import type { RoomState } from "../../../domain/entities"
import type { BidNotFoundError, DatabaseError, RequestNotFoundError, RoomNotOpenError } from "../../../domain/errors"
import { RoomNotifier } from "../../../domain/ports/room-notifier"
import { RoomRepository } from "../../../domain/ports/room-repository"

export const acceptBidCommand = (
  identity: AuthIdentity,
  input: AcceptBidInput,
): Effect.Effect<RoomState, BidNotFoundError | RoomNotOpenError | RequestNotFoundError | DatabaseError, RoomRepository | RoomNotifier> =>
  Effect.gen(function* () {
    const repo = yield* RoomRepository
    const notifier = yield* RoomNotifier
    const next = yield* repo.acceptBid(identity.authUserId, input)
    yield* notifier.notifyRoomUpdated(input.requestId)
    return next
  })
