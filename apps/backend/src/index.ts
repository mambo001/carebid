import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  RequestResolutionResponseSchema,
  WithdrawBidInputSchema,
} from "@carebid/shared"

import { acceptBidCommand } from "./application/commands/room/accept-bid"
import { expireRoomCommand } from "./application/commands/room/expire-room"
import { placeBidCommand } from "./application/commands/room/place-bid"
import { syncRoomStatusCommand } from "./application/commands/room/sync-room-status"
import { connectViewerCommand, disconnectViewerCommand } from "./application/commands/room/viewer-presence"
import { withdrawBidCommand } from "./application/commands/room/withdraw-bid"
import { getRoomSnapshotQuery } from "./application/queries/room/get-room-snapshot"
import { createApp } from "./app"
import { RoomNotOpenError } from "./domain/errors"
import { RoomGateway } from "./domain/ports/room-gateway"
import type { RoomState } from "./domain/entities"
import { makeDurableObjectRoomGatewayLayer, createRoomSnapshot, createSnapshotMessage } from "./infra/room/durable-object-room-gateway"

const validStatuses = ["draft", "open", "awarded", "expired"] as const

const parseInitialStatus = (param: string | null): RoomState["status"] =>
  validStatuses.includes(param as RoomState["status"]) ? (param as RoomState["status"]) : "open"

const closedResponse = (state: RoomState) =>
  Response.json(
    { ok: false, error: "Request is no longer open", snapshot: createRoomSnapshot(state) },
    { status: 409 },
  )

const onRoomNotOpen = (requestId: string) =>
  Effect.gen(function* () {
    const state = yield* getRoomSnapshotQuery(requestId)
    return closedResponse(state)
  })

export class RequestRoomDurableObject {
  private sessions = new Set<WebSocket>()

  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {}

  private provide<Result, E>(effect: Effect.Effect<Result, E, RoomGateway>): Effect.Effect<Result, E, never> {
    return Effect.provide(effect, makeDurableObjectRoomGatewayLayer(this.state, this.sessions))
  }

  private async connectWebSocket(requestId: string): Promise<Response> {
    const state = await Effect.runPromise(this.provide(connectViewerCommand(requestId)))

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

    server.accept()
    this.sessions.add(server)
    server.send(createSnapshotMessage(state))

    server.addEventListener("close", () => {
      this.sessions.delete(server)
      void this.state.blockConcurrencyWhile(() =>
        Effect.runPromise(this.provide(disconnectViewerCommand(requestId))),
      )
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const requestId = url.searchParams.get("requestId") ?? this.state.id.toString()
    const initialStatus = parseInitialStatus(url.searchParams.get("status"))

    if (request.method === "GET" && url.pathname === "/connect") {
      return this.connectWebSocket(requestId)
    }

    const effect = Effect.gen(function* () {
      if (request.method === "GET" && url.pathname === "/snapshot") {
        const state = yield* getRoomSnapshotQuery(requestId, initialStatus)
        return Response.json(createRoomSnapshot(state))
      }

      if (request.method === "POST" && url.pathname === "/status/sync") {
        const body = Schema.decodeUnknownSync(
          Schema.Struct({ status: Schema.Literal("draft", "open", "awarded", "expired") }),
        )(yield* Effect.tryPromise(() => request.json()))
        const state = yield* syncRoomStatusCommand(requestId, body.status)
        return Response.json(createRoomSnapshot(state))
      }

      if (request.method === "POST" && url.pathname === "/bids/place") {
        const input = Schema.decodeUnknownSync(BidInputSchema)(yield* Effect.tryPromise(() => request.json()))
        return yield* placeBidCommand(input).pipe(
          Effect.map((state) => Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        )
      }

      if (request.method === "POST" && url.pathname === "/bids/withdraw") {
        const input = Schema.decodeUnknownSync(WithdrawBidInputSchema)(yield* Effect.tryPromise(() => request.json()))
        return yield* withdrawBidCommand(input).pipe(
          Effect.map((state) => Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        )
      }

      if (request.method === "POST" && url.pathname === "/bids/accept") {
        const input = Schema.decodeUnknownSync(AcceptBidInputSchema)(yield* Effect.tryPromise(() => request.json()))
        return yield* acceptBidCommand(input).pipe(
          Effect.map((state) => Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        )
      }

      if (request.method === "POST" && url.pathname === "/expire") {
        return yield* expireRoomCommand(requestId).pipe(
          Effect.map((state) => Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        )
      }

      return new Response("Not implemented", { status: 501 })
    })

    return Effect.runPromise(this.provide(effect))
  }
}

export default createApp()
