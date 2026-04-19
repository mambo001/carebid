import { Hono } from "hono"

import { RequestRoomSnapshotSchema } from "@carebid/shared"
import * as Schema from "@effect/schema/Schema"

import { createRouter } from "./lib/router"

export class RequestRoomDurableObject {
  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === "GET" && url.pathname === "/snapshot") {
      const requestId = url.searchParams.get("requestId") ?? this.state.id.toString()
      const stored = await this.state.storage.get("snapshot")

      const snapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)(
        stored ?? {
          requestId,
          status: "draft",
          connectedViewers: 0,
          leaderboard: [],
        },
      )

      return Response.json(snapshot)
    }

    return new Response("Not implemented", { status: 501 })
  }
}

const app = new Hono<{ Bindings: Env }>()

app.route("/", createRouter())

export default app
