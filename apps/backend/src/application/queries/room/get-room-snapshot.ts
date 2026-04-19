import { Effect } from "effect"

import type { RoomState } from "../../../domain/entities"
import { RoomGateway } from "../../../domain/ports/room-gateway"

export const getRoomSnapshotQuery = (requestId: string, initialStatus?: RoomState["status"]) =>
  Effect.gen(function* () {
    const gateway = yield* RoomGateway
    return yield* gateway.getRoomState(requestId, initialStatus)
  })
