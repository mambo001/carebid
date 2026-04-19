import { Effect, Layer } from "effect"

import { RoomState } from "../domain/entities"
import { RoomGateway } from "../domain/ports/room-gateway"
import { makeEmptyRoomState } from "../domain/room"

export const makeInMemoryRoomGateway = (): RoomGateway => {
  const store = new Map<string, RoomState>()

  return {
    getRoomState: (requestId, initialStatus) => {
      const existing = store.get(requestId)
      if (existing) return Effect.succeed(existing)
      const fresh = makeEmptyRoomState(requestId, initialStatus)
      store.set(requestId, fresh)
      return Effect.succeed(fresh)
    },

    putRoomState: (state) => {
      store.set(state.requestId, state)
      return Effect.succeed(undefined)
    },

    broadcast: () => Effect.succeed(undefined),
  }
}

export const InMemoryRoomGatewayLayer = Layer.sync(RoomGateway, makeInMemoryRoomGateway)
