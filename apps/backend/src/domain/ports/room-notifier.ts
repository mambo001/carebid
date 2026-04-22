import { Context, Effect } from "effect"

export interface RoomNotifier {
  readonly notifyRoomUpdated: (requestId: string) => Effect.Effect<void, never>
}

export const RoomNotifier = Context.GenericTag<RoomNotifier>("@carebid/RoomNotifier")
