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

export class RequestRoomDurableObject {
  private sessions = new Set<WebSocket>()

  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {}

  private run<Result, E>(
    effect: Effect.Effect<Result, E, RoomGateway>,
  ): Promise<Result> {
    const layer = makeDurableObjectRoomGatewayLayer(this.state, this.sessions)
    return Effect.runPromise(Effect.provide(effect, layer))
  }

  private closedResponse(state: RoomState) {
    return Response.json(
      { ok: false, error: "Request is no longer open", snapshot: createRoomSnapshot(state) },
      { status: 409 },
    )
  }

  private async connectWebSocket(requestId: string): Promise<Response> {
    const state = await this.run(connectViewerCommand(requestId))
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    server.accept()
    this.sessions.add(server)
    server.send(createSnapshotMessage(state))

    server.addEventListener("close", () => {
      this.sessions.delete(server)
      void this.state.blockConcurrencyWhile(() => this.run(disconnectViewerCommand(requestId)))
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const requestId = url.searchParams.get("requestId") ?? this.state.id.toString()
    const statusParam = url.searchParams.get("status") as RoomState["status"] | null
    const initialStatus: RoomState["status"] =
      statusParam === "draft" || statusParam === "open" || statusParam === "awarded" || statusParam === "expired"
        ? statusParam
        : "open"

    if (request.method === "GET" && url.pathname === "/connect") {
      return this.connectWebSocket(requestId)
    }

    if (request.method === "GET" && url.pathname === "/snapshot") {
      const state = await this.run(getRoomSnapshotQuery(requestId, initialStatus))
      return Response.json(createRoomSnapshot(state))
    }

    if (request.method === "POST" && url.pathname === "/status/sync") {
      const body = Schema.decodeUnknownSync(
        Schema.Struct({ status: Schema.Literal("draft", "open", "awarded", "expired") }),
      )(await request.json())
      const state = await this.run(syncRoomStatusCommand(requestId, body.status))
      return Response.json(createRoomSnapshot(state))
    }

    if (request.method === "POST" && url.pathname === "/bids/place") {
      const input = Schema.decodeUnknownSync(BidInputSchema)(await request.json())
      try {
        const state = await this.run(placeBidCommand(input))
        return Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))
      } catch (error) {
        if (error instanceof RoomNotOpenError) {
          return this.closedResponse(await this.run(getRoomSnapshotQuery(requestId)))
        }
        throw error
      }
    }

    if (request.method === "POST" && url.pathname === "/bids/withdraw") {
      const input = Schema.decodeUnknownSync(WithdrawBidInputSchema)(await request.json())
      try {
        const state = await this.run(withdrawBidCommand(input))
        return Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))
      } catch (error) {
        if (error instanceof RoomNotOpenError) {
          return this.closedResponse(await this.run(getRoomSnapshotQuery(requestId)))
        }
        throw error
      }
    }

    if (request.method === "POST" && url.pathname === "/bids/accept") {
      const input = Schema.decodeUnknownSync(AcceptBidInputSchema)(await request.json())
      try {
        const state = await this.run(acceptBidCommand(input))
        return Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))
      } catch (error) {
        if (error instanceof RoomNotOpenError) {
          return this.closedResponse(await this.run(getRoomSnapshotQuery(requestId)))
        }
        throw error
      }
    }

    if (request.method === "POST" && url.pathname === "/expire") {
      try {
        const state = await this.run(expireRoomCommand(requestId))
        return Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) }))
      } catch (error) {
        if (error instanceof RoomNotOpenError) {
          return this.closedResponse(await this.run(getRoomSnapshotQuery(requestId)))
        }
        throw error
      }
    }

    return new Response("Not implemented", { status: 501 })
  }
}

export default createApp()
