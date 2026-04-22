import { Effect } from "effect"

import type { AuthIdentity } from "../../../domain/ports/session-repository"
import type { RoomState } from "../../../domain/entities"
import type { DatabaseError, RequestNotFoundError, RoomNotOpenError } from "../../../domain/errors"
import { RoomNotifier } from "../../../domain/ports/room-notifier"
import { RoomRepository } from "../../../domain/ports/room-repository"

export const expireRoomCommand = (
  identity: AuthIdentity,
  requestId: string,
): Effect.Effect<RoomState, RoomNotOpenError | RequestNotFoundError | DatabaseError, RoomRepository | RoomNotifier> =>
  Effect.gen(function* () {
    const repo = yield* RoomRepository
    const notifier = yield* RoomNotifier
    const next = yield* repo.expireRoom(identity.authUserId, requestId)
    yield* notifier.notifyRoomUpdated(requestId)
    return next
  })
