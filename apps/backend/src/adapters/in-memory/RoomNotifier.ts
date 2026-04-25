import { Effect, Layer, Console } from "effect"
import { RoomNotifier } from "../../ports/RoomNotifier"
import { RequestId } from "../../data/branded"

export const make = Effect.gen(function* () {
  const notifyRoomUpdated = (requestId: RequestId) =>
    Console.log(`[MOCK] Room updated: ${requestId}`)

  return RoomNotifier.of({ notifyRoomUpdated })
})

export const layer = Layer.effect(RoomNotifier, make)
