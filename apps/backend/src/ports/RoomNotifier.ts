import { Context, Effect } from "effect"
import { RequestId } from "../data/branded"

export class RoomNotifier extends Context.Tag("@carebid/RoomNotifier")<
  RoomNotifier,
  {
    readonly notifyRoomUpdated: (requestId: RequestId) => Effect.Effect<void>
  }
>() {}
