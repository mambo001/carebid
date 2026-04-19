import { Hono } from "hono"

import { appName } from "@carebid/shared"

export const createRouter = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/health", (c) => c.json({ ok: true, app: appName, env: c.env.APP_NAME }))

  app.get("/api/requests", (c) =>
    c.json({
      items: [],
      filters: ["specialist_consult", "imaging"],
    }),
  )

  return app
}
