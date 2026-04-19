import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { switchRole } from "../../application/commands/switch-role"
import { getSession } from "../../application/queries/get-session"
import { runAppEffect } from "../../app"
import { SessionResponseSchema, ViewerRoleSchema } from "@carebid/shared"

export const createSessionRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/session", (c) =>
    runAppEffect(
      c.env,
      getSession(),
      (session) =>
        c.json(
          Schema.decodeUnknownSync(SessionResponseSchema)({
            ok: true,
            session,
          }),
        ),
    ),
  )

  app.post("/session/role", async (c) => {
    const body = await c.req.json()
    const role = Schema.decodeUnknownSync(
      Schema.Struct({
        role: Schema.optional(ViewerRoleSchema),
      }),
    )(body).role

    return runAppEffect(
      c.env,
      switchRole(role),
      (session) =>
        c.json(
          Schema.decodeUnknownSync(SessionResponseSchema)({
            ok: true,
            session,
          }),
        ),
    )
  })

  return app
}
