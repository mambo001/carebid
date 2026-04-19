import { Effect, Layer } from "effect"
import * as Schema from "@effect/schema/Schema"

import { RequestRoomSnapshotSchema, RoomSnapshotMessageSchema } from "@carebid/shared"

import { RoomState } from "../../domain/entities"
import { DatabaseError } from "../../domain/errors"
import { RoomGateway } from "../../domain/ports/room-gateway"
import { makeEmptyRoomState } from "../../domain/room"

const roomStateKey = "room-state"

export const createRoomSnapshot = (state: RoomState) =>
  Schema.decodeUnknownSync(RequestRoomSnapshotSchema)({
    requestId: state.requestId,
    status: state.status,
    awardedBidId: state.awardedBidId,
    connectedViewers: state.connectedViewers,
    leaderboard: state.bids
      .filter((bid) => bid.status === "active")
      .sort((a, b) => a.amountCents - b.amountCents)
      .map((bid) => ({
        bidId: bid.bidId,
        providerId: bid.providerId,
        providerDisplayName: bid.providerDisplayName,
        amountCents: bid.amountCents,
        availableDate: bid.availableDate,
        notes: bid.notes,
      })),
  })

export const createSnapshotMessage = (state: RoomState) =>
  JSON.stringify(
    Schema.decodeUnknownSync(RoomSnapshotMessageSchema)({
      type: "snapshot",
      snapshot: createRoomSnapshot(state),
    }),
  )

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
