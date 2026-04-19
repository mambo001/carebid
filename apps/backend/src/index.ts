import { Hono } from "hono"

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

app.get("/health", (c) => c.json({ ok: true, app: c.env.APP_NAME }))

export default app
