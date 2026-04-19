import { Hono } from "hono"

import { createRouter } from "./lib/router"

export class RequestRoomDurableObject {
  constructor(
    readonly state: DurableObjectState,
    readonly env: Env,
  ) {}

  async fetch(): Promise<Response> {
    return new Response("Not implemented", { status: 501 })
  }
}

const app = new Hono<{ Bindings: Env }>()

app.route("/", createRouter())

export default app
