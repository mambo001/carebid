import { Effect } from "effect"
import { Hono } from "hono"

import { connectViewerCommand, disconnectViewerCommand } from "./application/commands/room/viewer-presence"
import { createApp } from "./app"
import { RoomGateway } from "./domain/ports/room-gateway"
import { makeDurableObjectRoomGatewayLayer, createSnapshotMessage } from "./infra/room/durable-object-room-gateway"
import { createRoomRoutes } from "./interface/routes/room"

export class RequestRoomDurableObject {
  private sessions = new Set<WebSocket>()
  private router: Hono

  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {
    this.router = new Hono()
    this.router.route("/", createRoomRoutes(this.provide.bind(this)))
    this.router.get("/connect", (c) => {
      const requestId = c.req.query("requestId") ?? this.state.id.toString()
      return this.connectWebSocket(requestId)
    })
  }

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

  fetch(request: Request): Promise<Response> {
    return Promise.resolve(this.router.fetch(request))
  }
}

export default createApp()
