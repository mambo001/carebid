import { Effect, Layer } from "effect"

import { RoomState } from "../../domain/entities"
import { DatabaseError } from "../../domain/errors"
import { RoomGateway } from "../../domain/ports/room-gateway"
import { makeEmptyRoomState, createSnapshotMessage } from "../../domain/room"

const roomStateKey = "room-state"

export const makeDurableObjectRoomGatewayLayer = (
  doState: DurableObjectState,
  sessions: Set<WebSocket>,
) =>
  Layer.succeed(
    RoomGateway,
    {
      getRoomState: (requestId, initialStatus = "open") =>
        Effect.tryPromise({
          try: async () => {
            const stored = await doState.storage.get<RoomState>(roomStateKey)
            return stored ?? makeEmptyRoomState(requestId, initialStatus)
          },
          catch: (error) => new DatabaseError({ message: String(error) }),
        }),

      putRoomState: (state) =>
        Effect.tryPromise({
          try: () => doState.storage.put(roomStateKey, state),
          catch: (error) => new DatabaseError({ message: String(error) }),
        }),

      broadcast: (state) =>
        Effect.sync(() => {
          const message = createSnapshotMessage(state)

          for (const session of sessions) {
            try {
              session.send(message)
            } catch {
              sessions.delete(session)
            }
          }
        }),
    },
  )
