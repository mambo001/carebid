import { Context, Effect } from "effect"

import { DatabaseError } from "../errors"
import { RoomState } from "../entities"

export interface RoomGateway {
  readonly getRoomState: (requestId: string, initialStatus?: RoomState["status"]) => Effect.Effect<RoomState, DatabaseError>
  readonly putRoomState: (state: RoomState) => Effect.Effect<void, DatabaseError>
  readonly broadcast: (state: RoomState) => Effect.Effect<void, never>
}

export const RoomGateway = Context.GenericTag<RoomGateway>("@carebid/RoomGateway")
