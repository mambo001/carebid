import { Hono } from "hono"

import {
  BidInputSchema,
  BidMutationResponseSchema,
  RequestRoomSnapshotSchema,
  RoomSnapshotMessageSchema,
  WithdrawBidInputSchema,
} from "@carebid/shared"
import * as Schema from "@effect/schema/Schema"

import { createRouter } from "./lib/router"

type RoomBid = {
  bidId: string
  providerId: string
  providerDisplayName: string
  amountCents: number
  availableDate: string
  notes?: string
  status: "active" | "withdrawn"
}

type RoomState = {
  requestId: string
  status: "draft" | "open" | "awarded" | "expired"
  connectedViewers: number
  bids: RoomBid[]
}

const roomStateKey = "room-state"

export class RequestRoomDurableObject {
  private sessions = new Set<WebSocket>()

  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {}

  private async getRoomState(requestId: string): Promise<RoomState> {
    const stored = await this.state.storage.get<RoomState>(roomStateKey)

    return (
      stored ?? {
        requestId,
        status: "open",
        connectedViewers: 0,
        bids: [],
      }
    )
  }

  private createSnapshot(roomState: RoomState) {
    return Schema.decodeUnknownSync(RequestRoomSnapshotSchema)({
      requestId: roomState.requestId,
      status: roomState.status,
      connectedViewers: roomState.connectedViewers,
      leaderboard: roomState.bids
        .filter((bid) => bid.status === "active")
        .sort((left, right) => left.amountCents - right.amountCents)
        .map((bid) => ({
          bidId: bid.bidId,
          providerId: bid.providerId,
          providerDisplayName: bid.providerDisplayName,
          amountCents: bid.amountCents,
          availableDate: bid.availableDate,
          notes: bid.notes,
        })),
    })
  }

  private async persistAndBroadcast(roomState: RoomState) {
    await this.state.storage.put(roomStateKey, roomState)

    const message = JSON.stringify(
      Schema.decodeUnknownSync(RoomSnapshotMessageSchema)({
        type: "snapshot",
        snapshot: this.createSnapshot(roomState),
      }),
    )

    for (const session of this.sessions) {
      try {
        session.send(message)
      } catch {
        this.sessions.delete(session)
      }
    }
  }

  private async connectWebSocket(requestId: string): Promise<Response> {
    const roomState = await this.getRoomState(requestId)
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    server.accept()
    this.sessions.add(server)

    roomState.connectedViewers += 1
    await this.persistAndBroadcast(roomState)

    server.addEventListener("close", () => {
      this.sessions.delete(server)
      void this.state.blockConcurrencyWhile(async () => {
        const current = await this.getRoomState(requestId)
        current.connectedViewers = Math.max(0, current.connectedViewers - 1)
        await this.persistAndBroadcast(current)
      })
    })

    server.send(
      JSON.stringify(
        Schema.decodeUnknownSync(RoomSnapshotMessageSchema)({
          type: "snapshot",
          snapshot: this.createSnapshot(roomState),
        }),
      ),
    )

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const requestId = url.searchParams.get("requestId") ?? this.state.id.toString()

    if (request.method === "GET" && url.pathname === "/connect") {
      return this.connectWebSocket(requestId)
    }

    if (request.method === "GET" && url.pathname === "/snapshot") {
      const snapshot = this.createSnapshot(await this.getRoomState(requestId))

      return Response.json(snapshot)
    }

    if (request.method === "POST" && url.pathname === "/bids/place") {
      const input = Schema.decodeUnknownSync(BidInputSchema)(await request.json())
      const roomState = await this.getRoomState(requestId)
      const existingBidIndex = roomState.bids.findIndex((bid) => bid.providerId === input.providerId)

      const nextBid: RoomBid = {
        bidId: existingBidIndex >= 0 ? roomState.bids[existingBidIndex].bidId : `bid-${crypto.randomUUID()}`,
        providerId: input.providerId,
        providerDisplayName: input.providerDisplayName,
        amountCents: input.amountCents,
        availableDate: input.availableDate,
        notes: input.notes,
        status: "active",
      }

      if (existingBidIndex >= 0) {
        roomState.bids[existingBidIndex] = nextBid
      } else {
        roomState.bids.push(nextBid)
      }

      await this.persistAndBroadcast(roomState)

      return Response.json(
        Schema.decodeUnknownSync(BidMutationResponseSchema)({
          ok: true,
          snapshot: this.createSnapshot(roomState),
        }),
      )
    }

    if (request.method === "POST" && url.pathname === "/bids/withdraw") {
      const input = Schema.decodeUnknownSync(WithdrawBidInputSchema)(await request.json())
      const roomState = await this.getRoomState(requestId)

      roomState.bids = roomState.bids.map((bid) =>
        bid.providerId === input.providerId ? { ...bid, status: "withdrawn" } : bid,
      )

      await this.persistAndBroadcast(roomState)

      return Response.json(
        Schema.decodeUnknownSync(BidMutationResponseSchema)({
          ok: true,
          snapshot: this.createSnapshot(roomState),
        }),
      )
    }

    return new Response("Not implemented", { status: 501 })
  }
}

const app = new Hono<{ Bindings: Env }>()

app.route("/", createRouter())

export default app
