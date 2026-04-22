import { Effect } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError, RequestNotFoundError } from "../../../domain/errors"
import { RoomRepository } from "../../../domain/ports/room-repository"

export const getRoomSnapshotQuery = (
  requestId: string,
): Effect.Effect<RoomState, DatabaseError | RequestNotFoundError, RoomRepository> =>
  Effect.gen(function* () {
    const repo = yield* RoomRepository
    return yield* repo.getRoomState(requestId)
  })
